import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/use-auth';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type TransactionType = 'import' | 'export' | 'return' | 'debt' | 'repayment';

interface Transaction {
    id: string;
    product_variation_id: string;
    quantity: number;
    unit_price: number;
    selling_price: number;
    total_amount: number;
    transaction_type: TransactionType;
    transaction_date: string;
    product_name: string;
    variation_name?: string;
    customer_id?: string | null;
    customer_name?: string | null;
    group_id?: string | null;
    returns?: Array<{ id: string; quantity: number; total_amount: number }>;
}

interface TransactionItem {
    id: string;
    product_variation_id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    product_name: string;
    variation_name?: string;
    sku?: string;
    original_quantity?: number; // For tracking return limit
}

interface NewSaleItem {
    product_variation_id: string;
    quantity: number;
    unit_price: number; // Selling price
    product_name: string;
    variation_name?: string;
}

interface Product {
    id: string;
    name: string;
    product_variations: Array<{
        id: string;
        name?: string;
        selling_price: number;
    }>;
}

export const Exchange = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || "ru-RU";
    const queryClient = useQueryClient();
    const { userStore: currentStore, isLoading } = useAuth();
    const { id: routeTransactionId } = useParams();
    const navigate = useNavigate();

    const [searchTransactionId, setSearchTransactionId] = useState(routeTransactionId || '');
    const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);
    const [groupTransactions, setGroupTransactions] = useState<Transaction[]>([]); // All transactions in the SAME POS session
    const [returnItems, setReturnItems] = useState<TransactionItem[]>([]);
    const [newSaleItems, setNewSaleItems] = useState<NewSaleItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');

    // Search Transaction
    const searchMutation = useMutation({
        mutationFn: async (id: string): Promise<Transaction> => {
            const response = await api.get<{ transaction: Transaction }>(`/api/transactions/${id}`);
            return response.transaction;
        },
        onSuccess: async (data: Transaction) => {
            setOriginalTransaction(data);

            // If transaction has a group_id, fetch ALL transactions from THE SAME POS session using groupId filter
            if (data.group_id) {
                try {
                    const params = new URLSearchParams();
                    if (currentStore?.store_id) {
                        params.append('storeId', currentStore.store_id);
                    }

                    // Use the new dedicated endpoint for fetching grouped transactions
                    const groupResponse = await api.get<{ transactions: Transaction[] }>(`/api/transactions/group/${data.group_id}?${params.toString()}`);
                    const groupTxs = groupResponse.transactions || [];

                    // Filter only export/debt transactions that haven't been fully returned
                    const returnableItems = groupTxs.filter((tx: Transaction) => {
                        if (tx.transaction_type !== 'export' && tx.transaction_type !== 'debt') return false;
                        const returnedQty = tx.returns?.reduce((sum, r) => sum + r.quantity, 0) || 0;
                        const remainingQty = tx.quantity - returnedQty;
                        return remainingQty > 0;
                    });

                    setGroupTransactions(returnableItems);
                } catch (error) {
                    console.error('Failed to fetch group transactions', error);
                    setGroupTransactions([data]); // Fallback to single transaction
                }
            } else {
                // Single transaction (no group)
                if (data.transaction_type === 'export' || data.transaction_type === 'debt') {
                    const returnedQty = data.returns?.reduce((sum, r) => sum + r.quantity, 0) || 0;
                    const remainingQty = data.quantity - returnedQty;

                    if (remainingQty > 0) {
                        setGroupTransactions([data]);
                    } else {
                        toast.error(t('exchange.errors.alreadyReturned'));
                        setOriginalTransaction(null);
                        setGroupTransactions([]);
                    }
                } else {
                    toast.error(t('exchange.errors.invalidType'));
                    setOriginalTransaction(null);
                    setGroupTransactions([]);
                }
            }

            // Reset return items
            setReturnItems([]);
        },
        onError: () => {
            toast.error(t('exchange.errors.notFound'));
            setOriginalTransaction(null);
        }
    });

    useEffect(() => {
        if (routeTransactionId && !isLoading) {
            setSearchTransactionId(routeTransactionId);
            searchMutation.mutate(routeTransactionId);
        }
    }, [routeTransactionId, isLoading]);

    const handleSearch = () => {
        if (searchTransactionId.trim()) {
            searchMutation.mutate(searchTransactionId.trim());
        }
    };

    // Exchange Mutation
    const exchangeMutation = useMutation({
        mutationFn: async (data: { returnQuantity: number; newProductVariationId: string; newQuantity: number; newUnitPrice: number; paymentMethod?: string }) => {
            // Use the first return item's ID for the exchange API call
            const transactionId = returnItems[0]?.id || originalTransaction?.id;
            if (!transactionId) throw new Error('No transaction selected');
            return api.post(`/api/transactions/${transactionId}/exchange`, data);
        },
        onSuccess: () => {
            toast.success(t('exchange.success'));
            // Reset form
            setOriginalTransaction(null);
            setReturnItems([]);
            setNewSaleItems([]);
            setSearchTransactionId('');
            setGroupTransactions([]);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            navigate('/transactions'); // Go back to list
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || t('common.errorDesc'));
        }
    });

    const handleAddToReturn = (transaction: Transaction) => {
        // Check if already added
        if (returnItems.some(item => item.id === transaction.id)) return;

        const returnedQty = transaction.returns?.reduce((sum, r) => sum + r.quantity, 0) || 0;
        const remainingQty = transaction.quantity - returnedQty;

        setReturnItems(prev => [...prev, {
            id: transaction.id,
            product_variation_id: transaction.product_variation_id,
            quantity: 1, // Default to 1
            unit_price: transaction.unit_price,
            total_amount: transaction.unit_price,
            product_name: transaction.product_name,
            variation_name: transaction.variation_name,
            original_quantity: remainingQty
        }]);
    };

    const handleUpdateReturnQuantity = (itemId: string, qty: number) => {
        const item = returnItems.find(i => i.id === itemId);
        if (!item) return;

        if (qty > (item.original_quantity || 0)) return;
        if (qty < 1) {
            setReturnItems(prev => prev.filter(i => i.id !== itemId)); // Remove if 0
            return;
        }

        setReturnItems(prev => prev.map(i =>
            i.id === itemId
                ? { ...i, quantity: qty, total_amount: qty * i.unit_price }
                : i
        ));
    };

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const productSearchQuery = useQuery({
        queryKey: ['products', productSearchTerm],
        queryFn: async () => {
            if (!productSearchTerm) return [];
            const searchParams = new URLSearchParams();
            searchParams.append('search', productSearchTerm);
            if (currentStore?.store_id) {
                searchParams.append('storeId', currentStore.store_id);
            }
            const res = await api.get<{ products: Product[] }>(`/api/products/list?${searchParams.toString()}`);
            return res.products || [];
        },
        enabled: productSearchTerm.length > 2
    });

    const handleAddProduct = (product: Product) => {
        // Check if already in list
        const existing = newSaleItems.find(i => i.product_variation_id === product.product_variations[0].id); // Simplified: taking first variation
        if (existing) {
            setNewSaleItems(newSaleItems.map(i =>
                i.product_variation_id === product.product_variations[0].id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setNewSaleItems([...newSaleItems, {
                product_variation_id: product.product_variations[0].id,
                quantity: 1,
                unit_price: product.product_variations[0].selling_price || 0,
                product_name: product.name,
                variation_name: product.product_variations[0].name
            }]);
        }
        setProductSearchTerm(''); // Clear search
    };

    const handleUpdateNewItemQuantity = (index: number, qty: number) => {
        if (qty < 1) {
            setNewSaleItems(newSaleItems.filter((_, i) => i !== index));
            return;
        }
        setNewSaleItems(newSaleItems.map((item, i) =>
            i === index ? { ...item, quantity: qty } : item
        ));
    };

    const calculateTotals = () => {
        const returnTotal = returnItems.reduce((sum, item) => sum + item.total_amount, 0);
        const newSaleTotal = newSaleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const netTotal = newSaleTotal - returnTotal;
        return { returnTotal, newSaleTotal, netTotal };
    };

    const { returnTotal, newSaleTotal, netTotal } = calculateTotals();

    const handleProcessExchange = () => {
        if (returnItems.length === 0 || newSaleItems.length === 0) return;

        if (newSaleItems.length > 1) {
            toast.warning(t('exchange.errors.singleItemOnly'));
            return;
        }

        const newItem = newSaleItems[0];
        const returnItem = returnItems[0];

        exchangeMutation.mutate({
            returnQuantity: returnItem.quantity,
            newProductVariationId: newItem.product_variation_id,
            newQuantity: newItem.quantity,
            newUnitPrice: newItem.unit_price,
            paymentMethod: netTotal !== 0 ? paymentMethod : undefined
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{t('exchange.title', 'Exchange')}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Return */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('exchange.returnItem', 'Return Item')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('exchange.searchPlaceholder', 'Scan receipt or enter Transaction ID')}
                                        className="pl-8"
                                        value={searchTransactionId}
                                        onChange={(e) => setSearchTransactionId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                                    {searchMutation.isPending ? t('common.loading') : t('common.search', 'Search')}
                                </Button>
                            </div>

                            {groupTransactions.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-medium text-sm">{t('exchange.availableItems', 'Available Items')}</h3>
                                    {groupTransactions.map((tx: Transaction) => (
                                        <div key={tx.id} className="border rounded-md p-4 bg-muted/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{tx.product_name}</p>
                                                    <p className="text-sm text-muted-foreground">{tx.variation_name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {tx.id.substring(0, 8)}...</p>
                                                </div>
                                                <Badge variant="outline">{formatCurrency(tx.unit_price, currentStore?.store?.currency || "UZS", locale)}</Badge>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>{t('common.quantity', 'Qty')}: {tx.quantity}</span>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleAddToReturn(tx)}
                                                    disabled={returnItems.some(item => item.id === tx.id)}
                                                >
                                                    {returnItems.some(item => item.id === tx.id) ? t('exchange.selected', 'Selected') : t('exchange.select', 'Select')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {returnItems.length > 0 && (
                                <div className="space-y-2">
                                    <Separator />
                                    <h3 className="font-medium text-sm">{t('exchange.selectedForReturn', 'Selected for Return')}</h3>
                                    {returnItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-900/50">
                                            <div>
                                                <p className="font-medium text-sm">{item.product_name}</p>
                                                <p className="text-xs text-muted-foreground">{item.variation_name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    className="w-16 h-8"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateReturnQuantity(item.id, parseInt(e.target.value))}
                                                    max={item.original_quantity}
                                                    min={1}
                                                />
                                                <span className="text-sm font-medium text-red-600">
                                                    -{formatCurrency(item.total_amount, currentStore?.store?.currency || "UZS", locale)}
                                                </span>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setReturnItems(prev => prev.filter(i => i.id !== item.id))}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: New Sale */}
                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>{t('exchange.newItem', 'New Item')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col space-y-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('exchange.searchProduct', 'Search for new product...')}
                                    className="pl-8"
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                />
                                {productSearchQuery.data && productSearchQuery.data.length > 0 && (
                                    <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md mt-1 max-h-60 overflow-y-auto">
                                        {productSearchQuery.data.map((product: Product) => (
                                            <div
                                                key={product.id}
                                                className="p-2 hover:bg-muted cursor-pointer text-sm"
                                                onClick={() => handleAddProduct(product)}
                                            >
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {product.product_variations?.[0]?.name} - {formatCurrency(product.product_variations?.[0]?.selling_price, currentStore?.store?.currency || "UZS", locale)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                {newSaleItems.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                        {t('exchange.noItems', 'No items selected')}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {newSaleItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-900/50">
                                                <div>
                                                    <p className="font-medium text-sm">{item.product_name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.variation_name}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        className="w-16 h-8"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateNewItemQuantity(idx, parseInt(e.target.value))}
                                                        min={1}
                                                    />
                                                    <span className="text-sm font-medium text-green-600">
                                                        +{formatCurrency(item.quantity * item.unit_price, currentStore?.store?.currency || "UZS", locale)}
                                                    </span>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleUpdateNewItemQuantity(idx, 0)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('exchange.returnTotal', 'Return Total')}:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(returnTotal, currentStore?.store?.currency || "UZS", locale)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('exchange.newSaleTotal', 'New Sale Total')}:</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(newSaleTotal, currentStore?.store?.currency || "UZS", locale)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>{t('exchange.netTotal', 'Net Total')}:</span>
                                    <span className={netTotal > 0 ? "text-green-600" : netTotal < 0 ? "text-red-600" : ""}>
                                        {netTotal > 0 ? "+" : ""}{formatCurrency(netTotal, currentStore?.store?.currency || "UZS", locale)}
                                    </span>
                                </div>

                                {netTotal !== 0 && (
                                    <div className="pt-2">
                                        <label className="text-sm font-medium mb-1 block">
                                            {netTotal > 0 ? t('exchange.paymentMethod') : t('exchange.refundMethod')}
                                        </label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('payment.selectPaymentMethod', 'Select payment method')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">{t('payment.cash', 'Cash')}</SelectItem>
                                                <SelectItem value="card">{t('payment.card', 'Card')}</SelectItem>
                                                <SelectItem value="transfer">{t('payment.transfer', 'Transfer')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button
                                    className="w-full mt-4"
                                    size="lg"
                                    onClick={handleProcessExchange}
                                    disabled={exchangeMutation.isPending || returnItems.length === 0 || newSaleItems.length === 0}
                                >
                                    {exchangeMutation.isPending ? t('common.processing') : t('exchange.confirm')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Exchange;
