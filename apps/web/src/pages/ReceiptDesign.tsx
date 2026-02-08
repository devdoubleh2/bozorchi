import { useState, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner'
import {
    ArrowLeft,
    Save,
    RotateCcw,
    Bold,
    Italic,
    Heading1,
    Table as TableIcon,
    Minus,
    AlignCenter,
    Variable,
    Image as ImageIcon,
    Settings,
    Trash,
    Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_TEMPLATE = `<center>
{{storeLogo}}
</center>

<center>
# {{storeName}}
{{storeAddress}}
{{storePhone}}
</center>

---

**Receipt**: {{receiptId}}
**Date**: {{date}}
**Customer**: {{customerName}}

| Item | Qty | Price | Total |
| :--- | :--: | :---: | :---: |
{{itemsTable}}

---

**Subtotal**: {{subtotal}}
**Discount**: {{discount}}
**Total**: {{total}}

<center>
{{qrCode}}

**Scan to pay or view online**
</center>

---

<center>
**Follow us:**
{{instagram}} | {{telegram}} | {{facebook}}

{{marketingMessage}}

Thank you for shopping with us!
</center>
`;

const MOCK_DATA = {
    storeName: "My Awesome Store",
    storeAddress: "123 Main St, Tashkent, Uzbekistan",
    storePhone: "+998 90 123 45 67",
    receiptId: "REC-00123",
    date: new Date().toLocaleString(),
    customerName: "John Doe",
    itemsTable: `| Apple | 2 | 5,000 | 10,000 |
| Banana | 3 | 3,000 | 9,000 |
| Milk | 1 | 12,000 | 12,000 |`,
    subtotal: "31,000 UZS",
    discount: "0 UZS",
    total: "31,000 UZS",
};

type CustomVariables = Record<string, string>;

const DEFAULT_VARIABLES: CustomVariables = {
    storeLogo: `<img src="https://placehold.co/100x100/000000/FFFFFF/png?text=LOGO" alt="Store Logo" width="100" />`,
    qrCode: `<img src="https://placehold.co/100x100/000000/FFFFFF/png?text=QR" alt="QR Code" width="100" />`,
    instagram: "IG: @myawesomestore",
    telegram: "TG: @myawesomestore",
    facebook: "FB: My Awesome Store",
    marketingMessage: "Show this receipt for 5% off your next purchase!",
};

export default function ReceiptDesignPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [previewWidth, setPreviewWidth] = useState(80);
    const [customVariables, setCustomVariables] = useState<CustomVariables>(DEFAULT_VARIABLES);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [newVarKey, setNewVarKey] = useState("");
    const [newVarValue, setNewVarValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("receipt_template");
        if (saved) {
            setTemplate(saved);
        }
        const savedWidth = localStorage.getItem("receipt_width");
        if (savedWidth) {
            setPreviewWidth(Number(savedWidth));
        }
        const savedVariables = localStorage.getItem("receipt_custom_variables");
        if (savedVariables) {
            setCustomVariables(JSON.parse(savedVariables));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("receipt_template", template);
        localStorage.setItem("receipt_width", String(previewWidth));
        localStorage.setItem("receipt_custom_variables", JSON.stringify(customVariables));
        toast.success(t("settings.saved", { defaultValue: "Saved successfully" }));
    };

    const handleReset = () => {
        if (
            confirm(
                t("common.confirmReset", {
                    defaultValue: "Are you sure you want to reset to default?",
                })
            )
        ) {
            setTemplate(DEFAULT_TEMPLATE);
            setPreviewWidth(80);
            setCustomVariables(DEFAULT_VARIABLES);
        }
    };

    const handleAddVariable = () => {
        if (!newVarKey || !newVarValue) return;
        if (customVariables[newVarKey]) {
            toast.error(t("settings.variableExists", { defaultValue: "Variable already exists" }));
            return;
        }
        setCustomVariables({ ...customVariables, [newVarKey]: newVarValue });
        setNewVarKey("");
        setNewVarValue("");
    };

    const handleDeleteVariable = (key: string) => {
        const newVars = { ...customVariables };
        delete newVars[key];
        setCustomVariables(newVars);
    };

    const insertText = (before: string, after = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        const newText =
            text.substring(0, start) +
            before +
            selectedText +
            after +
            text.substring(end);

        setTemplate(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                end + before.length
            );
        }, 0);
    };

    const getPreviewContent = (tmpl: string) => {
        let content = tmpl;
        const allData = { ...MOCK_DATA, ...customVariables };
        Object.entries(allData).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
        });
        return content;
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            <header className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/account")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">
                        {t("settings.receiptDesign", { defaultValue: "Receipt Design" })}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t("settings.variables", { defaultValue: "Receipt Variables" })}</DialogTitle>
                                <DialogDescription>
                                    {t("settings.variablesDescription", { defaultValue: "Customize the values for your receipt variables." })}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {Object.entries(customVariables).map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-12 items-center gap-4">
                                        <Label htmlFor={key} className="col-span-3 text-right truncate" title={key}>
                                            {key}
                                        </Label>
                                        <Input
                                            id={key}
                                            value={value}
                                            onChange={(e) => setCustomVariables({ ...customVariables, [key]: e.target.value })}
                                            className="col-span-8"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="col-span-1 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteVariable(key)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="border-t pt-4 mt-4">
                                    <h4 className="mb-4 text-sm font-medium leading-none">
                                        {t("settings.addNewVariable", { defaultValue: "Add New Variable" })}
                                    </h4>
                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <Input
                                            placeholder="Key (e.g. wifiPassword)"
                                            value={newVarKey}
                                            onChange={(e) => setNewVarKey(e.target.value)}
                                            className="col-span-4"
                                        />
                                        <Input
                                            placeholder="Value"
                                            value={newVarValue}
                                            onChange={(e) => setNewVarValue(e.target.value)}
                                            className="col-span-7"
                                        />
                                        <Button
                                            size="icon"
                                            className="col-span-1"
                                            onClick={handleAddVariable}
                                            disabled={!newVarKey || !newVarValue}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setIsSettingsOpen(false)}>
                                    {t("common.done", { defaultValue: "Done" })}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t("common.reset", { defaultValue: "Reset" })}
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        {t("common.save", { defaultValue: "Save" })}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Editor */}
                <div className="flex w-1/2 flex-col border-r">
                    <div className="flex items-center gap-1 border-b bg-muted/40 px-4 py-2">
                        <ToggleGroup type="multiple" className="justify-start">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => insertText("**", "**")}
                                title="Bold"
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => insertText("*", "*")}
                                title="Italic"
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => insertText("# ")}
                                title="Heading"
                            >
                                <Heading1 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => insertText("\n---\n")}
                                title="Divider"
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                    insertText(
                                        "\n| Item | Qty | Price | Total |\n| :--- | :--: | :---: | :---: |\n| Item 1 | 1 | 100 | 100 |\n"
                                    )
                                }
                                title="Table"
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                            <div className="mx-2 h-4 w-[1px] bg-border" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => insertText("<center>\n", "\n</center>")}
                                title="Center"
                            >
                                <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => insertText('<img src="" alt="" width="100" />')}
                                title="Image"
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </ToggleGroup>
                        <div className="ml-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-2">
                                        <Variable className="h-4 w-4" />
                                        {t("settings.variables", { defaultValue: "Variables" })}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {Object.keys({ ...MOCK_DATA, ...customVariables }).map((key) => (
                                        <DropdownMenuItem
                                            key={key}
                                            onClick={() => insertText(`{{${key}}}`)}
                                        >
                                            {key}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <Textarea
                        ref={textareaRef}
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="flex-1 resize-none rounded-none border-0 p-6 font-mono text-sm focus-visible:ring-0"
                        placeholder={t("settings.enterMarkdown", {
                            defaultValue: "Enter markdown here...",
                        })}
                    />
                </div>

                {/* Preview */}
                <div className="flex w-1/2 flex-col bg-muted/10 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-medium">
                            {t("settings.preview", { defaultValue: "Live Preview" })}
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {t("settings.width", { defaultValue: "Width" })}: {previewWidth}mm
                            </span>
                            <Slider
                                value={[previewWidth]}
                                onValueChange={(vals: number[]) => setPreviewWidth(vals[0])}
                                min={50}
                                max={100}
                                step={1}
                                className="w-32"
                            />
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden">
                        <Card
                            className="h-full overflow-auto bg-white shadow-lg transition-all duration-300"
                            style={{ width: `${previewWidth}mm` }}
                        >
                            <CardContent className="p-2">
                                <div className="prose prose-sm max-w-none text-[12px] leading-tight text-black prose-headings:text-black prose-strong:text-black prose-p:my-0.5 prose-headings:my-1 prose-hr:my-2 prose-hr:border-gray-300 prose-img:my-1 prose-table:text-black prose-th:text-black prose-td:text-black">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            center: ({ children }: { children?: ReactNode }) => (
                                                <div className="text-center">{children}</div>
                                            ),
                                            p: ({ children }: { children?: ReactNode }) => (
                                                <p className="mb-1 last:mb-0">{children}</p>
                                            ),
                                            hr: () => (
                                                <hr className="my-2 border-t border-gray-400" />
                                            ),
                                            img: ({ src, alt, width }: { src?: string; alt?: string; width?: string | number }) => (
                                                <img
                                                    src={src}
                                                    alt={alt}
                                                    width={width}
                                                    className="max-w-full h-auto mx-auto"
                                                />
                                            ),
                                        }}
                                    >
                                        {getPreviewContent(template)}
                                    </ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
