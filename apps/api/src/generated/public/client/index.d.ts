
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Organization
 * 
 */
export type Organization = $Result.DefaultSelection<Prisma.$OrganizationPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model UserAuthIdentity
 * 
 */
export type UserAuthIdentity = $Result.DefaultSelection<Prisma.$UserAuthIdentityPayload>
/**
 * Model MobilePushToken
 * 
 */
export type MobilePushToken = $Result.DefaultSelection<Prisma.$MobilePushTokenPayload>
/**
 * Model PasswordResetToken
 * 
 */
export type PasswordResetToken = $Result.DefaultSelection<Prisma.$PasswordResetTokenPayload>
/**
 * Model UserOrganization
 * 
 */
export type UserOrganization = $Result.DefaultSelection<Prisma.$UserOrganizationPayload>
/**
 * Model StoreInvite
 * 
 */
export type StoreInvite = $Result.DefaultSelection<Prisma.$StoreInvitePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Permission: {
  POS_ACCESS: 'POS_ACCESS',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY',
  VIEW_COST_PRICE: 'VIEW_COST_PRICE',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  VIEW_DASHBOARD: 'VIEW_DASHBOARD'
};

export type Permission = (typeof Permission)[keyof typeof Permission]


export const SubscriptionStatus: {
  incomplete: 'incomplete',
  incomplete_expired: 'incomplete_expired',
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid'
};

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]


export const Role: {
  admin: 'admin',
  user: 'user'
};

export type Role = (typeof Role)[keyof typeof Role]

}

export type Permission = $Enums.Permission

export const Permission: typeof $Enums.Permission

export type SubscriptionStatus = $Enums.SubscriptionStatus

export const SubscriptionStatus: typeof $Enums.SubscriptionStatus

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Organizations
 * const organizations = await prisma.organization.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Organizations
   * const organizations = await prisma.organization.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.organization`: Exposes CRUD operations for the **Organization** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Organizations
    * const organizations = await prisma.organization.findMany()
    * ```
    */
  get organization(): Prisma.OrganizationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userAuthIdentity`: Exposes CRUD operations for the **UserAuthIdentity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserAuthIdentities
    * const userAuthIdentities = await prisma.userAuthIdentity.findMany()
    * ```
    */
  get userAuthIdentity(): Prisma.UserAuthIdentityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.mobilePushToken`: Exposes CRUD operations for the **MobilePushToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MobilePushTokens
    * const mobilePushTokens = await prisma.mobilePushToken.findMany()
    * ```
    */
  get mobilePushToken(): Prisma.MobilePushTokenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.passwordResetToken`: Exposes CRUD operations for the **PasswordResetToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PasswordResetTokens
    * const passwordResetTokens = await prisma.passwordResetToken.findMany()
    * ```
    */
  get passwordResetToken(): Prisma.PasswordResetTokenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userOrganization`: Exposes CRUD operations for the **UserOrganization** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserOrganizations
    * const userOrganizations = await prisma.userOrganization.findMany()
    * ```
    */
  get userOrganization(): Prisma.UserOrganizationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.storeInvite`: Exposes CRUD operations for the **StoreInvite** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StoreInvites
    * const storeInvites = await prisma.storeInvite.findMany()
    * ```
    */
  get storeInvite(): Prisma.StoreInviteDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.3.0
   * Query Engine version: 9d6ad21cbbceab97458517b147a6a09ff43aa735
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Organization: 'Organization',
    User: 'User',
    UserAuthIdentity: 'UserAuthIdentity',
    MobilePushToken: 'MobilePushToken',
    PasswordResetToken: 'PasswordResetToken',
    UserOrganization: 'UserOrganization',
    StoreInvite: 'StoreInvite'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "organization" | "user" | "userAuthIdentity" | "mobilePushToken" | "passwordResetToken" | "userOrganization" | "storeInvite"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Organization: {
        payload: Prisma.$OrganizationPayload<ExtArgs>
        fields: Prisma.OrganizationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrganizationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrganizationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          findFirst: {
            args: Prisma.OrganizationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrganizationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          findMany: {
            args: Prisma.OrganizationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>[]
          }
          create: {
            args: Prisma.OrganizationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          createMany: {
            args: Prisma.OrganizationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrganizationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>[]
          }
          delete: {
            args: Prisma.OrganizationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          update: {
            args: Prisma.OrganizationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          deleteMany: {
            args: Prisma.OrganizationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrganizationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OrganizationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>[]
          }
          upsert: {
            args: Prisma.OrganizationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          aggregate: {
            args: Prisma.OrganizationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrganization>
          }
          groupBy: {
            args: Prisma.OrganizationGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrganizationGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrganizationCountArgs<ExtArgs>
            result: $Utils.Optional<OrganizationCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      UserAuthIdentity: {
        payload: Prisma.$UserAuthIdentityPayload<ExtArgs>
        fields: Prisma.UserAuthIdentityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserAuthIdentityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserAuthIdentityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>
          }
          findFirst: {
            args: Prisma.UserAuthIdentityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserAuthIdentityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>
          }
          findMany: {
            args: Prisma.UserAuthIdentityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>[]
          }
          create: {
            args: Prisma.UserAuthIdentityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>
          }
          createMany: {
            args: Prisma.UserAuthIdentityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserAuthIdentityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>[]
          }
          delete: {
            args: Prisma.UserAuthIdentityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>
          }
          update: {
            args: Prisma.UserAuthIdentityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>
          }
          deleteMany: {
            args: Prisma.UserAuthIdentityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserAuthIdentityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserAuthIdentityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>[]
          }
          upsert: {
            args: Prisma.UserAuthIdentityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserAuthIdentityPayload>
          }
          aggregate: {
            args: Prisma.UserAuthIdentityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserAuthIdentity>
          }
          groupBy: {
            args: Prisma.UserAuthIdentityGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserAuthIdentityGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserAuthIdentityCountArgs<ExtArgs>
            result: $Utils.Optional<UserAuthIdentityCountAggregateOutputType> | number
          }
        }
      }
      MobilePushToken: {
        payload: Prisma.$MobilePushTokenPayload<ExtArgs>
        fields: Prisma.MobilePushTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MobilePushTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MobilePushTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>
          }
          findFirst: {
            args: Prisma.MobilePushTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MobilePushTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>
          }
          findMany: {
            args: Prisma.MobilePushTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>[]
          }
          create: {
            args: Prisma.MobilePushTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>
          }
          createMany: {
            args: Prisma.MobilePushTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MobilePushTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>[]
          }
          delete: {
            args: Prisma.MobilePushTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>
          }
          update: {
            args: Prisma.MobilePushTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>
          }
          deleteMany: {
            args: Prisma.MobilePushTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MobilePushTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MobilePushTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>[]
          }
          upsert: {
            args: Prisma.MobilePushTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MobilePushTokenPayload>
          }
          aggregate: {
            args: Prisma.MobilePushTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMobilePushToken>
          }
          groupBy: {
            args: Prisma.MobilePushTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<MobilePushTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.MobilePushTokenCountArgs<ExtArgs>
            result: $Utils.Optional<MobilePushTokenCountAggregateOutputType> | number
          }
        }
      }
      PasswordResetToken: {
        payload: Prisma.$PasswordResetTokenPayload<ExtArgs>
        fields: Prisma.PasswordResetTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PasswordResetTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          findFirst: {
            args: Prisma.PasswordResetTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PasswordResetTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          findMany: {
            args: Prisma.PasswordResetTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>[]
          }
          create: {
            args: Prisma.PasswordResetTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          createMany: {
            args: Prisma.PasswordResetTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PasswordResetTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>[]
          }
          delete: {
            args: Prisma.PasswordResetTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          update: {
            args: Prisma.PasswordResetTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          deleteMany: {
            args: Prisma.PasswordResetTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PasswordResetTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>[]
          }
          upsert: {
            args: Prisma.PasswordResetTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          aggregate: {
            args: Prisma.PasswordResetTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePasswordResetToken>
          }
          groupBy: {
            args: Prisma.PasswordResetTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.PasswordResetTokenCountArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetTokenCountAggregateOutputType> | number
          }
        }
      }
      UserOrganization: {
        payload: Prisma.$UserOrganizationPayload<ExtArgs>
        fields: Prisma.UserOrganizationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserOrganizationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserOrganizationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>
          }
          findFirst: {
            args: Prisma.UserOrganizationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserOrganizationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>
          }
          findMany: {
            args: Prisma.UserOrganizationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>[]
          }
          create: {
            args: Prisma.UserOrganizationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>
          }
          createMany: {
            args: Prisma.UserOrganizationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserOrganizationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>[]
          }
          delete: {
            args: Prisma.UserOrganizationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>
          }
          update: {
            args: Prisma.UserOrganizationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>
          }
          deleteMany: {
            args: Prisma.UserOrganizationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserOrganizationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserOrganizationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>[]
          }
          upsert: {
            args: Prisma.UserOrganizationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserOrganizationPayload>
          }
          aggregate: {
            args: Prisma.UserOrganizationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserOrganization>
          }
          groupBy: {
            args: Prisma.UserOrganizationGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserOrganizationGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserOrganizationCountArgs<ExtArgs>
            result: $Utils.Optional<UserOrganizationCountAggregateOutputType> | number
          }
        }
      }
      StoreInvite: {
        payload: Prisma.$StoreInvitePayload<ExtArgs>
        fields: Prisma.StoreInviteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StoreInviteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StoreInviteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>
          }
          findFirst: {
            args: Prisma.StoreInviteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StoreInviteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>
          }
          findMany: {
            args: Prisma.StoreInviteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>[]
          }
          create: {
            args: Prisma.StoreInviteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>
          }
          createMany: {
            args: Prisma.StoreInviteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StoreInviteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>[]
          }
          delete: {
            args: Prisma.StoreInviteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>
          }
          update: {
            args: Prisma.StoreInviteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>
          }
          deleteMany: {
            args: Prisma.StoreInviteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StoreInviteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StoreInviteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>[]
          }
          upsert: {
            args: Prisma.StoreInviteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreInvitePayload>
          }
          aggregate: {
            args: Prisma.StoreInviteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStoreInvite>
          }
          groupBy: {
            args: Prisma.StoreInviteGroupByArgs<ExtArgs>
            result: $Utils.Optional<StoreInviteGroupByOutputType>[]
          }
          count: {
            args: Prisma.StoreInviteCountArgs<ExtArgs>
            result: $Utils.Optional<StoreInviteCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    organization?: OrganizationOmit
    user?: UserOmit
    userAuthIdentity?: UserAuthIdentityOmit
    mobilePushToken?: MobilePushTokenOmit
    passwordResetToken?: PasswordResetTokenOmit
    userOrganization?: UserOrganizationOmit
    storeInvite?: StoreInviteOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type OrganizationCountOutputType
   */

  export type OrganizationCountOutputType = {
    members: number
    invites: number
  }

  export type OrganizationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    members?: boolean | OrganizationCountOutputTypeCountMembersArgs
    invites?: boolean | OrganizationCountOutputTypeCountInvitesArgs
  }

  // Custom InputTypes
  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizationCountOutputType
     */
    select?: OrganizationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeCountMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserOrganizationWhereInput
  }

  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeCountInvitesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoreInviteWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    mobile_push_tokens: number
    password_reset_tokens: number
    auth_identities: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    mobile_push_tokens?: boolean | UserCountOutputTypeCountMobile_push_tokensArgs
    password_reset_tokens?: boolean | UserCountOutputTypeCountPassword_reset_tokensArgs
    auth_identities?: boolean | UserCountOutputTypeCountAuth_identitiesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountMobile_push_tokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MobilePushTokenWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPassword_reset_tokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetTokenWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAuth_identitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserAuthIdentityWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Organization
   */

  export type AggregateOrganization = {
    _count: OrganizationCountAggregateOutputType | null
    _min: OrganizationMinAggregateOutputType | null
    _max: OrganizationMaxAggregateOutputType | null
  }

  export type OrganizationMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    created_at: Date | null
    updated_at: Date | null
    subscription_id: string | null
    subscription_status: $Enums.SubscriptionStatus | null
    subscription_ends_at: Date | null
    owner_id: string | null
    uzum_fastpay_enabled: boolean | null
    uzum_fastpay_merchant_id: string | null
    uzum_fastpay_secret_key: string | null
    uzum_fastpay_service_id: string | null
    uzum_fastpay_merchant_service_user_id: string | null
    ecommerce_enabled: boolean | null
  }

  export type OrganizationMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    created_at: Date | null
    updated_at: Date | null
    subscription_id: string | null
    subscription_status: $Enums.SubscriptionStatus | null
    subscription_ends_at: Date | null
    owner_id: string | null
    uzum_fastpay_enabled: boolean | null
    uzum_fastpay_merchant_id: string | null
    uzum_fastpay_secret_key: string | null
    uzum_fastpay_service_id: string | null
    uzum_fastpay_merchant_service_user_id: string | null
    ecommerce_enabled: boolean | null
  }

  export type OrganizationCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    created_at: number
    updated_at: number
    subscription_id: number
    subscription_status: number
    subscription_ends_at: number
    owner_id: number
    uzum_fastpay_enabled: number
    uzum_fastpay_merchant_id: number
    uzum_fastpay_secret_key: number
    uzum_fastpay_service_id: number
    uzum_fastpay_merchant_service_user_id: number
    ecommerce_enabled: number
    _all: number
  }


  export type OrganizationMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    created_at?: true
    updated_at?: true
    subscription_id?: true
    subscription_status?: true
    subscription_ends_at?: true
    owner_id?: true
    uzum_fastpay_enabled?: true
    uzum_fastpay_merchant_id?: true
    uzum_fastpay_secret_key?: true
    uzum_fastpay_service_id?: true
    uzum_fastpay_merchant_service_user_id?: true
    ecommerce_enabled?: true
  }

  export type OrganizationMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    created_at?: true
    updated_at?: true
    subscription_id?: true
    subscription_status?: true
    subscription_ends_at?: true
    owner_id?: true
    uzum_fastpay_enabled?: true
    uzum_fastpay_merchant_id?: true
    uzum_fastpay_secret_key?: true
    uzum_fastpay_service_id?: true
    uzum_fastpay_merchant_service_user_id?: true
    ecommerce_enabled?: true
  }

  export type OrganizationCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    created_at?: true
    updated_at?: true
    subscription_id?: true
    subscription_status?: true
    subscription_ends_at?: true
    owner_id?: true
    uzum_fastpay_enabled?: true
    uzum_fastpay_merchant_id?: true
    uzum_fastpay_secret_key?: true
    uzum_fastpay_service_id?: true
    uzum_fastpay_merchant_service_user_id?: true
    ecommerce_enabled?: true
    _all?: true
  }

  export type OrganizationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Organization to aggregate.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Organizations
    **/
    _count?: true | OrganizationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrganizationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrganizationMaxAggregateInputType
  }

  export type GetOrganizationAggregateType<T extends OrganizationAggregateArgs> = {
        [P in keyof T & keyof AggregateOrganization]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrganization[P]>
      : GetScalarType<T[P], AggregateOrganization[P]>
  }




  export type OrganizationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrganizationWhereInput
    orderBy?: OrganizationOrderByWithAggregationInput | OrganizationOrderByWithAggregationInput[]
    by: OrganizationScalarFieldEnum[] | OrganizationScalarFieldEnum
    having?: OrganizationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrganizationCountAggregateInputType | true
    _min?: OrganizationMinAggregateInputType
    _max?: OrganizationMaxAggregateInputType
  }

  export type OrganizationGroupByOutputType = {
    id: string
    name: string
    slug: string
    created_at: Date
    updated_at: Date
    subscription_id: string | null
    subscription_status: $Enums.SubscriptionStatus | null
    subscription_ends_at: Date | null
    owner_id: string
    uzum_fastpay_enabled: boolean
    uzum_fastpay_merchant_id: string | null
    uzum_fastpay_secret_key: string | null
    uzum_fastpay_service_id: string | null
    uzum_fastpay_merchant_service_user_id: string | null
    ecommerce_enabled: boolean
    _count: OrganizationCountAggregateOutputType | null
    _min: OrganizationMinAggregateOutputType | null
    _max: OrganizationMaxAggregateOutputType | null
  }

  type GetOrganizationGroupByPayload<T extends OrganizationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrganizationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrganizationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrganizationGroupByOutputType[P]>
            : GetScalarType<T[P], OrganizationGroupByOutputType[P]>
        }
      >
    >


  export type OrganizationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    created_at?: boolean
    updated_at?: boolean
    subscription_id?: boolean
    subscription_status?: boolean
    subscription_ends_at?: boolean
    owner_id?: boolean
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: boolean
    uzum_fastpay_secret_key?: boolean
    uzum_fastpay_service_id?: boolean
    uzum_fastpay_merchant_service_user_id?: boolean
    ecommerce_enabled?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
    members?: boolean | Organization$membersArgs<ExtArgs>
    invites?: boolean | Organization$invitesArgs<ExtArgs>
    _count?: boolean | OrganizationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["organization"]>

  export type OrganizationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    created_at?: boolean
    updated_at?: boolean
    subscription_id?: boolean
    subscription_status?: boolean
    subscription_ends_at?: boolean
    owner_id?: boolean
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: boolean
    uzum_fastpay_secret_key?: boolean
    uzum_fastpay_service_id?: boolean
    uzum_fastpay_merchant_service_user_id?: boolean
    ecommerce_enabled?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["organization"]>

  export type OrganizationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    created_at?: boolean
    updated_at?: boolean
    subscription_id?: boolean
    subscription_status?: boolean
    subscription_ends_at?: boolean
    owner_id?: boolean
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: boolean
    uzum_fastpay_secret_key?: boolean
    uzum_fastpay_service_id?: boolean
    uzum_fastpay_merchant_service_user_id?: boolean
    ecommerce_enabled?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["organization"]>

  export type OrganizationSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    created_at?: boolean
    updated_at?: boolean
    subscription_id?: boolean
    subscription_status?: boolean
    subscription_ends_at?: boolean
    owner_id?: boolean
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: boolean
    uzum_fastpay_secret_key?: boolean
    uzum_fastpay_service_id?: boolean
    uzum_fastpay_merchant_service_user_id?: boolean
    ecommerce_enabled?: boolean
  }

  export type OrganizationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "slug" | "created_at" | "updated_at" | "subscription_id" | "subscription_status" | "subscription_ends_at" | "owner_id" | "uzum_fastpay_enabled" | "uzum_fastpay_merchant_id" | "uzum_fastpay_secret_key" | "uzum_fastpay_service_id" | "uzum_fastpay_merchant_service_user_id" | "ecommerce_enabled", ExtArgs["result"]["organization"]>
  export type OrganizationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
    members?: boolean | Organization$membersArgs<ExtArgs>
    invites?: boolean | Organization$invitesArgs<ExtArgs>
    _count?: boolean | OrganizationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type OrganizationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type OrganizationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $OrganizationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Organization"
    objects: {
      owner: Prisma.$UserPayload<ExtArgs>
      members: Prisma.$UserOrganizationPayload<ExtArgs>[]
      invites: Prisma.$StoreInvitePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      created_at: Date
      updated_at: Date
      subscription_id: string | null
      subscription_status: $Enums.SubscriptionStatus | null
      subscription_ends_at: Date | null
      owner_id: string
      uzum_fastpay_enabled: boolean
      uzum_fastpay_merchant_id: string | null
      uzum_fastpay_secret_key: string | null
      uzum_fastpay_service_id: string | null
      uzum_fastpay_merchant_service_user_id: string | null
      ecommerce_enabled: boolean
    }, ExtArgs["result"]["organization"]>
    composites: {}
  }

  type OrganizationGetPayload<S extends boolean | null | undefined | OrganizationDefaultArgs> = $Result.GetResult<Prisma.$OrganizationPayload, S>

  type OrganizationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrganizationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrganizationCountAggregateInputType | true
    }

  export interface OrganizationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Organization'], meta: { name: 'Organization' } }
    /**
     * Find zero or one Organization that matches the filter.
     * @param {OrganizationFindUniqueArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrganizationFindUniqueArgs>(args: SelectSubset<T, OrganizationFindUniqueArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Organization that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrganizationFindUniqueOrThrowArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrganizationFindUniqueOrThrowArgs>(args: SelectSubset<T, OrganizationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Organization that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationFindFirstArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrganizationFindFirstArgs>(args?: SelectSubset<T, OrganizationFindFirstArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Organization that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationFindFirstOrThrowArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrganizationFindFirstOrThrowArgs>(args?: SelectSubset<T, OrganizationFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Organizations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Organizations
     * const organizations = await prisma.organization.findMany()
     * 
     * // Get first 10 Organizations
     * const organizations = await prisma.organization.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const organizationWithIdOnly = await prisma.organization.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrganizationFindManyArgs>(args?: SelectSubset<T, OrganizationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Organization.
     * @param {OrganizationCreateArgs} args - Arguments to create a Organization.
     * @example
     * // Create one Organization
     * const Organization = await prisma.organization.create({
     *   data: {
     *     // ... data to create a Organization
     *   }
     * })
     * 
     */
    create<T extends OrganizationCreateArgs>(args: SelectSubset<T, OrganizationCreateArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Organizations.
     * @param {OrganizationCreateManyArgs} args - Arguments to create many Organizations.
     * @example
     * // Create many Organizations
     * const organization = await prisma.organization.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrganizationCreateManyArgs>(args?: SelectSubset<T, OrganizationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Organizations and returns the data saved in the database.
     * @param {OrganizationCreateManyAndReturnArgs} args - Arguments to create many Organizations.
     * @example
     * // Create many Organizations
     * const organization = await prisma.organization.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Organizations and only return the `id`
     * const organizationWithIdOnly = await prisma.organization.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrganizationCreateManyAndReturnArgs>(args?: SelectSubset<T, OrganizationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Organization.
     * @param {OrganizationDeleteArgs} args - Arguments to delete one Organization.
     * @example
     * // Delete one Organization
     * const Organization = await prisma.organization.delete({
     *   where: {
     *     // ... filter to delete one Organization
     *   }
     * })
     * 
     */
    delete<T extends OrganizationDeleteArgs>(args: SelectSubset<T, OrganizationDeleteArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Organization.
     * @param {OrganizationUpdateArgs} args - Arguments to update one Organization.
     * @example
     * // Update one Organization
     * const organization = await prisma.organization.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrganizationUpdateArgs>(args: SelectSubset<T, OrganizationUpdateArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Organizations.
     * @param {OrganizationDeleteManyArgs} args - Arguments to filter Organizations to delete.
     * @example
     * // Delete a few Organizations
     * const { count } = await prisma.organization.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrganizationDeleteManyArgs>(args?: SelectSubset<T, OrganizationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Organizations
     * const organization = await prisma.organization.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrganizationUpdateManyArgs>(args: SelectSubset<T, OrganizationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Organizations and returns the data updated in the database.
     * @param {OrganizationUpdateManyAndReturnArgs} args - Arguments to update many Organizations.
     * @example
     * // Update many Organizations
     * const organization = await prisma.organization.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Organizations and only return the `id`
     * const organizationWithIdOnly = await prisma.organization.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OrganizationUpdateManyAndReturnArgs>(args: SelectSubset<T, OrganizationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Organization.
     * @param {OrganizationUpsertArgs} args - Arguments to update or create a Organization.
     * @example
     * // Update or create a Organization
     * const organization = await prisma.organization.upsert({
     *   create: {
     *     // ... data to create a Organization
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Organization we want to update
     *   }
     * })
     */
    upsert<T extends OrganizationUpsertArgs>(args: SelectSubset<T, OrganizationUpsertArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationCountArgs} args - Arguments to filter Organizations to count.
     * @example
     * // Count the number of Organizations
     * const count = await prisma.organization.count({
     *   where: {
     *     // ... the filter for the Organizations we want to count
     *   }
     * })
    **/
    count<T extends OrganizationCountArgs>(
      args?: Subset<T, OrganizationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrganizationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Organization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrganizationAggregateArgs>(args: Subset<T, OrganizationAggregateArgs>): Prisma.PrismaPromise<GetOrganizationAggregateType<T>>

    /**
     * Group by Organization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrganizationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrganizationGroupByArgs['orderBy'] }
        : { orderBy?: OrganizationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrganizationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrganizationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Organization model
   */
  readonly fields: OrganizationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Organization.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrganizationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    owner<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    members<T extends Organization$membersArgs<ExtArgs> = {}>(args?: Subset<T, Organization$membersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    invites<T extends Organization$invitesArgs<ExtArgs> = {}>(args?: Subset<T, Organization$invitesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Organization model
   */
  interface OrganizationFieldRefs {
    readonly id: FieldRef<"Organization", 'String'>
    readonly name: FieldRef<"Organization", 'String'>
    readonly slug: FieldRef<"Organization", 'String'>
    readonly created_at: FieldRef<"Organization", 'DateTime'>
    readonly updated_at: FieldRef<"Organization", 'DateTime'>
    readonly subscription_id: FieldRef<"Organization", 'String'>
    readonly subscription_status: FieldRef<"Organization", 'SubscriptionStatus'>
    readonly subscription_ends_at: FieldRef<"Organization", 'DateTime'>
    readonly owner_id: FieldRef<"Organization", 'String'>
    readonly uzum_fastpay_enabled: FieldRef<"Organization", 'Boolean'>
    readonly uzum_fastpay_merchant_id: FieldRef<"Organization", 'String'>
    readonly uzum_fastpay_secret_key: FieldRef<"Organization", 'String'>
    readonly uzum_fastpay_service_id: FieldRef<"Organization", 'String'>
    readonly uzum_fastpay_merchant_service_user_id: FieldRef<"Organization", 'String'>
    readonly ecommerce_enabled: FieldRef<"Organization", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Organization findUnique
   */
  export type OrganizationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization findUniqueOrThrow
   */
  export type OrganizationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization findFirst
   */
  export type OrganizationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Organizations.
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Organizations.
     */
    distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
  }

  /**
   * Organization findFirstOrThrow
   */
  export type OrganizationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Organizations.
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Organizations.
     */
    distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
  }

  /**
   * Organization findMany
   */
  export type OrganizationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organizations to fetch.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Organizations.
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
  }

  /**
   * Organization create
   */
  export type OrganizationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * The data needed to create a Organization.
     */
    data: XOR<OrganizationCreateInput, OrganizationUncheckedCreateInput>
  }

  /**
   * Organization createMany
   */
  export type OrganizationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Organizations.
     */
    data: OrganizationCreateManyInput | OrganizationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Organization createManyAndReturn
   */
  export type OrganizationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * The data used to create many Organizations.
     */
    data: OrganizationCreateManyInput | OrganizationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Organization update
   */
  export type OrganizationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * The data needed to update a Organization.
     */
    data: XOR<OrganizationUpdateInput, OrganizationUncheckedUpdateInput>
    /**
     * Choose, which Organization to update.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization updateMany
   */
  export type OrganizationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Organizations.
     */
    data: XOR<OrganizationUpdateManyMutationInput, OrganizationUncheckedUpdateManyInput>
    /**
     * Filter which Organizations to update
     */
    where?: OrganizationWhereInput
    /**
     * Limit how many Organizations to update.
     */
    limit?: number
  }

  /**
   * Organization updateManyAndReturn
   */
  export type OrganizationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * The data used to update Organizations.
     */
    data: XOR<OrganizationUpdateManyMutationInput, OrganizationUncheckedUpdateManyInput>
    /**
     * Filter which Organizations to update
     */
    where?: OrganizationWhereInput
    /**
     * Limit how many Organizations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Organization upsert
   */
  export type OrganizationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * The filter to search for the Organization to update in case it exists.
     */
    where: OrganizationWhereUniqueInput
    /**
     * In case the Organization found by the `where` argument doesn't exist, create a new Organization with this data.
     */
    create: XOR<OrganizationCreateInput, OrganizationUncheckedCreateInput>
    /**
     * In case the Organization was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrganizationUpdateInput, OrganizationUncheckedUpdateInput>
  }

  /**
   * Organization delete
   */
  export type OrganizationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter which Organization to delete.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization deleteMany
   */
  export type OrganizationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Organizations to delete
     */
    where?: OrganizationWhereInput
    /**
     * Limit how many Organizations to delete.
     */
    limit?: number
  }

  /**
   * Organization.members
   */
  export type Organization$membersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    where?: UserOrganizationWhereInput
    orderBy?: UserOrganizationOrderByWithRelationInput | UserOrganizationOrderByWithRelationInput[]
    cursor?: UserOrganizationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserOrganizationScalarFieldEnum | UserOrganizationScalarFieldEnum[]
  }

  /**
   * Organization.invites
   */
  export type Organization$invitesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    where?: StoreInviteWhereInput
    orderBy?: StoreInviteOrderByWithRelationInput | StoreInviteOrderByWithRelationInput[]
    cursor?: StoreInviteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StoreInviteScalarFieldEnum | StoreInviteScalarFieldEnum[]
  }

  /**
   * Organization without action
   */
  export type OrganizationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    password_hash: string | null
    created_at: Date | null
    updated_at: Date | null
    push_token: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    password_hash: string | null
    created_at: Date | null
    updated_at: Date | null
    push_token: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    password_hash: number
    created_at: number
    updated_at: number
    push_token: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password_hash?: true
    created_at?: true
    updated_at?: true
    push_token?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password_hash?: true
    created_at?: true
    updated_at?: true
    push_token?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password_hash?: true
    created_at?: true
    updated_at?: true
    push_token?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string | null
    email: string
    password_hash: string | null
    created_at: Date
    updated_at: Date
    push_token: string | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
    updated_at?: boolean
    push_token?: boolean
    owned_organization?: boolean | User$owned_organizationArgs<ExtArgs>
    mobile_push_tokens?: boolean | User$mobile_push_tokensArgs<ExtArgs>
    password_reset_tokens?: boolean | User$password_reset_tokensArgs<ExtArgs>
    auth_identities?: boolean | User$auth_identitiesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
    updated_at?: boolean
    push_token?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
    updated_at?: boolean
    push_token?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
    updated_at?: boolean
    push_token?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "password_hash" | "created_at" | "updated_at" | "push_token", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owned_organization?: boolean | User$owned_organizationArgs<ExtArgs>
    mobile_push_tokens?: boolean | User$mobile_push_tokensArgs<ExtArgs>
    password_reset_tokens?: boolean | User$password_reset_tokensArgs<ExtArgs>
    auth_identities?: boolean | User$auth_identitiesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      owned_organization: Prisma.$OrganizationPayload<ExtArgs> | null
      mobile_push_tokens: Prisma.$MobilePushTokenPayload<ExtArgs>[]
      password_reset_tokens: Prisma.$PasswordResetTokenPayload<ExtArgs>[]
      auth_identities: Prisma.$UserAuthIdentityPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string | null
      email: string
      password_hash: string | null
      created_at: Date
      updated_at: Date
      push_token: string | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    owned_organization<T extends User$owned_organizationArgs<ExtArgs> = {}>(args?: Subset<T, User$owned_organizationArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    mobile_push_tokens<T extends User$mobile_push_tokensArgs<ExtArgs> = {}>(args?: Subset<T, User$mobile_push_tokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    password_reset_tokens<T extends User$password_reset_tokensArgs<ExtArgs> = {}>(args?: Subset<T, User$password_reset_tokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    auth_identities<T extends User$auth_identitiesArgs<ExtArgs> = {}>(args?: Subset<T, User$auth_identitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password_hash: FieldRef<"User", 'String'>
    readonly created_at: FieldRef<"User", 'DateTime'>
    readonly updated_at: FieldRef<"User", 'DateTime'>
    readonly push_token: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.owned_organization
   */
  export type User$owned_organizationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Organization
     */
    omit?: OrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    where?: OrganizationWhereInput
  }

  /**
   * User.mobile_push_tokens
   */
  export type User$mobile_push_tokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    where?: MobilePushTokenWhereInput
    orderBy?: MobilePushTokenOrderByWithRelationInput | MobilePushTokenOrderByWithRelationInput[]
    cursor?: MobilePushTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MobilePushTokenScalarFieldEnum | MobilePushTokenScalarFieldEnum[]
  }

  /**
   * User.password_reset_tokens
   */
  export type User$password_reset_tokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    where?: PasswordResetTokenWhereInput
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    cursor?: PasswordResetTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * User.auth_identities
   */
  export type User$auth_identitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    where?: UserAuthIdentityWhereInput
    orderBy?: UserAuthIdentityOrderByWithRelationInput | UserAuthIdentityOrderByWithRelationInput[]
    cursor?: UserAuthIdentityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserAuthIdentityScalarFieldEnum | UserAuthIdentityScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model UserAuthIdentity
   */

  export type AggregateUserAuthIdentity = {
    _count: UserAuthIdentityCountAggregateOutputType | null
    _min: UserAuthIdentityMinAggregateOutputType | null
    _max: UserAuthIdentityMaxAggregateOutputType | null
  }

  export type UserAuthIdentityMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    provider: string | null
    provider_user_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type UserAuthIdentityMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    provider: string | null
    provider_user_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type UserAuthIdentityCountAggregateOutputType = {
    id: number
    user_id: number
    provider: number
    provider_user_id: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type UserAuthIdentityMinAggregateInputType = {
    id?: true
    user_id?: true
    provider?: true
    provider_user_id?: true
    created_at?: true
    updated_at?: true
  }

  export type UserAuthIdentityMaxAggregateInputType = {
    id?: true
    user_id?: true
    provider?: true
    provider_user_id?: true
    created_at?: true
    updated_at?: true
  }

  export type UserAuthIdentityCountAggregateInputType = {
    id?: true
    user_id?: true
    provider?: true
    provider_user_id?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type UserAuthIdentityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserAuthIdentity to aggregate.
     */
    where?: UserAuthIdentityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserAuthIdentities to fetch.
     */
    orderBy?: UserAuthIdentityOrderByWithRelationInput | UserAuthIdentityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserAuthIdentityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserAuthIdentities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserAuthIdentities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserAuthIdentities
    **/
    _count?: true | UserAuthIdentityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserAuthIdentityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserAuthIdentityMaxAggregateInputType
  }

  export type GetUserAuthIdentityAggregateType<T extends UserAuthIdentityAggregateArgs> = {
        [P in keyof T & keyof AggregateUserAuthIdentity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserAuthIdentity[P]>
      : GetScalarType<T[P], AggregateUserAuthIdentity[P]>
  }




  export type UserAuthIdentityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserAuthIdentityWhereInput
    orderBy?: UserAuthIdentityOrderByWithAggregationInput | UserAuthIdentityOrderByWithAggregationInput[]
    by: UserAuthIdentityScalarFieldEnum[] | UserAuthIdentityScalarFieldEnum
    having?: UserAuthIdentityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserAuthIdentityCountAggregateInputType | true
    _min?: UserAuthIdentityMinAggregateInputType
    _max?: UserAuthIdentityMaxAggregateInputType
  }

  export type UserAuthIdentityGroupByOutputType = {
    id: string
    user_id: string
    provider: string
    provider_user_id: string
    created_at: Date
    updated_at: Date
    _count: UserAuthIdentityCountAggregateOutputType | null
    _min: UserAuthIdentityMinAggregateOutputType | null
    _max: UserAuthIdentityMaxAggregateOutputType | null
  }

  type GetUserAuthIdentityGroupByPayload<T extends UserAuthIdentityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserAuthIdentityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserAuthIdentityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserAuthIdentityGroupByOutputType[P]>
            : GetScalarType<T[P], UserAuthIdentityGroupByOutputType[P]>
        }
      >
    >


  export type UserAuthIdentitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_user_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userAuthIdentity"]>

  export type UserAuthIdentitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_user_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userAuthIdentity"]>

  export type UserAuthIdentitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_user_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userAuthIdentity"]>

  export type UserAuthIdentitySelectScalar = {
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_user_id?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type UserAuthIdentityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "provider" | "provider_user_id" | "created_at" | "updated_at", ExtArgs["result"]["userAuthIdentity"]>
  export type UserAuthIdentityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserAuthIdentityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserAuthIdentityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $UserAuthIdentityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserAuthIdentity"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      provider: string
      provider_user_id: string
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["userAuthIdentity"]>
    composites: {}
  }

  type UserAuthIdentityGetPayload<S extends boolean | null | undefined | UserAuthIdentityDefaultArgs> = $Result.GetResult<Prisma.$UserAuthIdentityPayload, S>

  type UserAuthIdentityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserAuthIdentityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserAuthIdentityCountAggregateInputType | true
    }

  export interface UserAuthIdentityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserAuthIdentity'], meta: { name: 'UserAuthIdentity' } }
    /**
     * Find zero or one UserAuthIdentity that matches the filter.
     * @param {UserAuthIdentityFindUniqueArgs} args - Arguments to find a UserAuthIdentity
     * @example
     * // Get one UserAuthIdentity
     * const userAuthIdentity = await prisma.userAuthIdentity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserAuthIdentityFindUniqueArgs>(args: SelectSubset<T, UserAuthIdentityFindUniqueArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserAuthIdentity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserAuthIdentityFindUniqueOrThrowArgs} args - Arguments to find a UserAuthIdentity
     * @example
     * // Get one UserAuthIdentity
     * const userAuthIdentity = await prisma.userAuthIdentity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserAuthIdentityFindUniqueOrThrowArgs>(args: SelectSubset<T, UserAuthIdentityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserAuthIdentity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityFindFirstArgs} args - Arguments to find a UserAuthIdentity
     * @example
     * // Get one UserAuthIdentity
     * const userAuthIdentity = await prisma.userAuthIdentity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserAuthIdentityFindFirstArgs>(args?: SelectSubset<T, UserAuthIdentityFindFirstArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserAuthIdentity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityFindFirstOrThrowArgs} args - Arguments to find a UserAuthIdentity
     * @example
     * // Get one UserAuthIdentity
     * const userAuthIdentity = await prisma.userAuthIdentity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserAuthIdentityFindFirstOrThrowArgs>(args?: SelectSubset<T, UserAuthIdentityFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserAuthIdentities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserAuthIdentities
     * const userAuthIdentities = await prisma.userAuthIdentity.findMany()
     * 
     * // Get first 10 UserAuthIdentities
     * const userAuthIdentities = await prisma.userAuthIdentity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userAuthIdentityWithIdOnly = await prisma.userAuthIdentity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserAuthIdentityFindManyArgs>(args?: SelectSubset<T, UserAuthIdentityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserAuthIdentity.
     * @param {UserAuthIdentityCreateArgs} args - Arguments to create a UserAuthIdentity.
     * @example
     * // Create one UserAuthIdentity
     * const UserAuthIdentity = await prisma.userAuthIdentity.create({
     *   data: {
     *     // ... data to create a UserAuthIdentity
     *   }
     * })
     * 
     */
    create<T extends UserAuthIdentityCreateArgs>(args: SelectSubset<T, UserAuthIdentityCreateArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserAuthIdentities.
     * @param {UserAuthIdentityCreateManyArgs} args - Arguments to create many UserAuthIdentities.
     * @example
     * // Create many UserAuthIdentities
     * const userAuthIdentity = await prisma.userAuthIdentity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserAuthIdentityCreateManyArgs>(args?: SelectSubset<T, UserAuthIdentityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserAuthIdentities and returns the data saved in the database.
     * @param {UserAuthIdentityCreateManyAndReturnArgs} args - Arguments to create many UserAuthIdentities.
     * @example
     * // Create many UserAuthIdentities
     * const userAuthIdentity = await prisma.userAuthIdentity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserAuthIdentities and only return the `id`
     * const userAuthIdentityWithIdOnly = await prisma.userAuthIdentity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserAuthIdentityCreateManyAndReturnArgs>(args?: SelectSubset<T, UserAuthIdentityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserAuthIdentity.
     * @param {UserAuthIdentityDeleteArgs} args - Arguments to delete one UserAuthIdentity.
     * @example
     * // Delete one UserAuthIdentity
     * const UserAuthIdentity = await prisma.userAuthIdentity.delete({
     *   where: {
     *     // ... filter to delete one UserAuthIdentity
     *   }
     * })
     * 
     */
    delete<T extends UserAuthIdentityDeleteArgs>(args: SelectSubset<T, UserAuthIdentityDeleteArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserAuthIdentity.
     * @param {UserAuthIdentityUpdateArgs} args - Arguments to update one UserAuthIdentity.
     * @example
     * // Update one UserAuthIdentity
     * const userAuthIdentity = await prisma.userAuthIdentity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserAuthIdentityUpdateArgs>(args: SelectSubset<T, UserAuthIdentityUpdateArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserAuthIdentities.
     * @param {UserAuthIdentityDeleteManyArgs} args - Arguments to filter UserAuthIdentities to delete.
     * @example
     * // Delete a few UserAuthIdentities
     * const { count } = await prisma.userAuthIdentity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserAuthIdentityDeleteManyArgs>(args?: SelectSubset<T, UserAuthIdentityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserAuthIdentities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserAuthIdentities
     * const userAuthIdentity = await prisma.userAuthIdentity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserAuthIdentityUpdateManyArgs>(args: SelectSubset<T, UserAuthIdentityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserAuthIdentities and returns the data updated in the database.
     * @param {UserAuthIdentityUpdateManyAndReturnArgs} args - Arguments to update many UserAuthIdentities.
     * @example
     * // Update many UserAuthIdentities
     * const userAuthIdentity = await prisma.userAuthIdentity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserAuthIdentities and only return the `id`
     * const userAuthIdentityWithIdOnly = await prisma.userAuthIdentity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserAuthIdentityUpdateManyAndReturnArgs>(args: SelectSubset<T, UserAuthIdentityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserAuthIdentity.
     * @param {UserAuthIdentityUpsertArgs} args - Arguments to update or create a UserAuthIdentity.
     * @example
     * // Update or create a UserAuthIdentity
     * const userAuthIdentity = await prisma.userAuthIdentity.upsert({
     *   create: {
     *     // ... data to create a UserAuthIdentity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserAuthIdentity we want to update
     *   }
     * })
     */
    upsert<T extends UserAuthIdentityUpsertArgs>(args: SelectSubset<T, UserAuthIdentityUpsertArgs<ExtArgs>>): Prisma__UserAuthIdentityClient<$Result.GetResult<Prisma.$UserAuthIdentityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserAuthIdentities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityCountArgs} args - Arguments to filter UserAuthIdentities to count.
     * @example
     * // Count the number of UserAuthIdentities
     * const count = await prisma.userAuthIdentity.count({
     *   where: {
     *     // ... the filter for the UserAuthIdentities we want to count
     *   }
     * })
    **/
    count<T extends UserAuthIdentityCountArgs>(
      args?: Subset<T, UserAuthIdentityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserAuthIdentityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserAuthIdentity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAuthIdentityAggregateArgs>(args: Subset<T, UserAuthIdentityAggregateArgs>): Prisma.PrismaPromise<GetUserAuthIdentityAggregateType<T>>

    /**
     * Group by UserAuthIdentity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAuthIdentityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserAuthIdentityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserAuthIdentityGroupByArgs['orderBy'] }
        : { orderBy?: UserAuthIdentityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserAuthIdentityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserAuthIdentityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserAuthIdentity model
   */
  readonly fields: UserAuthIdentityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserAuthIdentity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserAuthIdentityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserAuthIdentity model
   */
  interface UserAuthIdentityFieldRefs {
    readonly id: FieldRef<"UserAuthIdentity", 'String'>
    readonly user_id: FieldRef<"UserAuthIdentity", 'String'>
    readonly provider: FieldRef<"UserAuthIdentity", 'String'>
    readonly provider_user_id: FieldRef<"UserAuthIdentity", 'String'>
    readonly created_at: FieldRef<"UserAuthIdentity", 'DateTime'>
    readonly updated_at: FieldRef<"UserAuthIdentity", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserAuthIdentity findUnique
   */
  export type UserAuthIdentityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * Filter, which UserAuthIdentity to fetch.
     */
    where: UserAuthIdentityWhereUniqueInput
  }

  /**
   * UserAuthIdentity findUniqueOrThrow
   */
  export type UserAuthIdentityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * Filter, which UserAuthIdentity to fetch.
     */
    where: UserAuthIdentityWhereUniqueInput
  }

  /**
   * UserAuthIdentity findFirst
   */
  export type UserAuthIdentityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * Filter, which UserAuthIdentity to fetch.
     */
    where?: UserAuthIdentityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserAuthIdentities to fetch.
     */
    orderBy?: UserAuthIdentityOrderByWithRelationInput | UserAuthIdentityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserAuthIdentities.
     */
    cursor?: UserAuthIdentityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserAuthIdentities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserAuthIdentities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserAuthIdentities.
     */
    distinct?: UserAuthIdentityScalarFieldEnum | UserAuthIdentityScalarFieldEnum[]
  }

  /**
   * UserAuthIdentity findFirstOrThrow
   */
  export type UserAuthIdentityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * Filter, which UserAuthIdentity to fetch.
     */
    where?: UserAuthIdentityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserAuthIdentities to fetch.
     */
    orderBy?: UserAuthIdentityOrderByWithRelationInput | UserAuthIdentityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserAuthIdentities.
     */
    cursor?: UserAuthIdentityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserAuthIdentities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserAuthIdentities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserAuthIdentities.
     */
    distinct?: UserAuthIdentityScalarFieldEnum | UserAuthIdentityScalarFieldEnum[]
  }

  /**
   * UserAuthIdentity findMany
   */
  export type UserAuthIdentityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * Filter, which UserAuthIdentities to fetch.
     */
    where?: UserAuthIdentityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserAuthIdentities to fetch.
     */
    orderBy?: UserAuthIdentityOrderByWithRelationInput | UserAuthIdentityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserAuthIdentities.
     */
    cursor?: UserAuthIdentityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserAuthIdentities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserAuthIdentities.
     */
    skip?: number
    distinct?: UserAuthIdentityScalarFieldEnum | UserAuthIdentityScalarFieldEnum[]
  }

  /**
   * UserAuthIdentity create
   */
  export type UserAuthIdentityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * The data needed to create a UserAuthIdentity.
     */
    data: XOR<UserAuthIdentityCreateInput, UserAuthIdentityUncheckedCreateInput>
  }

  /**
   * UserAuthIdentity createMany
   */
  export type UserAuthIdentityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserAuthIdentities.
     */
    data: UserAuthIdentityCreateManyInput | UserAuthIdentityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserAuthIdentity createManyAndReturn
   */
  export type UserAuthIdentityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * The data used to create many UserAuthIdentities.
     */
    data: UserAuthIdentityCreateManyInput | UserAuthIdentityCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserAuthIdentity update
   */
  export type UserAuthIdentityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * The data needed to update a UserAuthIdentity.
     */
    data: XOR<UserAuthIdentityUpdateInput, UserAuthIdentityUncheckedUpdateInput>
    /**
     * Choose, which UserAuthIdentity to update.
     */
    where: UserAuthIdentityWhereUniqueInput
  }

  /**
   * UserAuthIdentity updateMany
   */
  export type UserAuthIdentityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserAuthIdentities.
     */
    data: XOR<UserAuthIdentityUpdateManyMutationInput, UserAuthIdentityUncheckedUpdateManyInput>
    /**
     * Filter which UserAuthIdentities to update
     */
    where?: UserAuthIdentityWhereInput
    /**
     * Limit how many UserAuthIdentities to update.
     */
    limit?: number
  }

  /**
   * UserAuthIdentity updateManyAndReturn
   */
  export type UserAuthIdentityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * The data used to update UserAuthIdentities.
     */
    data: XOR<UserAuthIdentityUpdateManyMutationInput, UserAuthIdentityUncheckedUpdateManyInput>
    /**
     * Filter which UserAuthIdentities to update
     */
    where?: UserAuthIdentityWhereInput
    /**
     * Limit how many UserAuthIdentities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserAuthIdentity upsert
   */
  export type UserAuthIdentityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * The filter to search for the UserAuthIdentity to update in case it exists.
     */
    where: UserAuthIdentityWhereUniqueInput
    /**
     * In case the UserAuthIdentity found by the `where` argument doesn't exist, create a new UserAuthIdentity with this data.
     */
    create: XOR<UserAuthIdentityCreateInput, UserAuthIdentityUncheckedCreateInput>
    /**
     * In case the UserAuthIdentity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserAuthIdentityUpdateInput, UserAuthIdentityUncheckedUpdateInput>
  }

  /**
   * UserAuthIdentity delete
   */
  export type UserAuthIdentityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
    /**
     * Filter which UserAuthIdentity to delete.
     */
    where: UserAuthIdentityWhereUniqueInput
  }

  /**
   * UserAuthIdentity deleteMany
   */
  export type UserAuthIdentityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserAuthIdentities to delete
     */
    where?: UserAuthIdentityWhereInput
    /**
     * Limit how many UserAuthIdentities to delete.
     */
    limit?: number
  }

  /**
   * UserAuthIdentity without action
   */
  export type UserAuthIdentityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserAuthIdentity
     */
    select?: UserAuthIdentitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserAuthIdentity
     */
    omit?: UserAuthIdentityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserAuthIdentityInclude<ExtArgs> | null
  }


  /**
   * Model MobilePushToken
   */

  export type AggregateMobilePushToken = {
    _count: MobilePushTokenCountAggregateOutputType | null
    _min: MobilePushTokenMinAggregateOutputType | null
    _max: MobilePushTokenMaxAggregateOutputType | null
  }

  export type MobilePushTokenMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    token: string | null
    platform: string | null
    provider: string | null
    device_name: string | null
    app_version: string | null
    build_number: string | null
    created_at: Date | null
    updated_at: Date | null
    last_seen_at: Date | null
  }

  export type MobilePushTokenMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    token: string | null
    platform: string | null
    provider: string | null
    device_name: string | null
    app_version: string | null
    build_number: string | null
    created_at: Date | null
    updated_at: Date | null
    last_seen_at: Date | null
  }

  export type MobilePushTokenCountAggregateOutputType = {
    id: number
    user_id: number
    token: number
    platform: number
    provider: number
    device_name: number
    app_version: number
    build_number: number
    created_at: number
    updated_at: number
    last_seen_at: number
    _all: number
  }


  export type MobilePushTokenMinAggregateInputType = {
    id?: true
    user_id?: true
    token?: true
    platform?: true
    provider?: true
    device_name?: true
    app_version?: true
    build_number?: true
    created_at?: true
    updated_at?: true
    last_seen_at?: true
  }

  export type MobilePushTokenMaxAggregateInputType = {
    id?: true
    user_id?: true
    token?: true
    platform?: true
    provider?: true
    device_name?: true
    app_version?: true
    build_number?: true
    created_at?: true
    updated_at?: true
    last_seen_at?: true
  }

  export type MobilePushTokenCountAggregateInputType = {
    id?: true
    user_id?: true
    token?: true
    platform?: true
    provider?: true
    device_name?: true
    app_version?: true
    build_number?: true
    created_at?: true
    updated_at?: true
    last_seen_at?: true
    _all?: true
  }

  export type MobilePushTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MobilePushToken to aggregate.
     */
    where?: MobilePushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MobilePushTokens to fetch.
     */
    orderBy?: MobilePushTokenOrderByWithRelationInput | MobilePushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MobilePushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MobilePushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MobilePushTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MobilePushTokens
    **/
    _count?: true | MobilePushTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MobilePushTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MobilePushTokenMaxAggregateInputType
  }

  export type GetMobilePushTokenAggregateType<T extends MobilePushTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateMobilePushToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMobilePushToken[P]>
      : GetScalarType<T[P], AggregateMobilePushToken[P]>
  }




  export type MobilePushTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MobilePushTokenWhereInput
    orderBy?: MobilePushTokenOrderByWithAggregationInput | MobilePushTokenOrderByWithAggregationInput[]
    by: MobilePushTokenScalarFieldEnum[] | MobilePushTokenScalarFieldEnum
    having?: MobilePushTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MobilePushTokenCountAggregateInputType | true
    _min?: MobilePushTokenMinAggregateInputType
    _max?: MobilePushTokenMaxAggregateInputType
  }

  export type MobilePushTokenGroupByOutputType = {
    id: string
    user_id: string
    token: string
    platform: string
    provider: string
    device_name: string | null
    app_version: string | null
    build_number: string | null
    created_at: Date
    updated_at: Date
    last_seen_at: Date
    _count: MobilePushTokenCountAggregateOutputType | null
    _min: MobilePushTokenMinAggregateOutputType | null
    _max: MobilePushTokenMaxAggregateOutputType | null
  }

  type GetMobilePushTokenGroupByPayload<T extends MobilePushTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MobilePushTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MobilePushTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MobilePushTokenGroupByOutputType[P]>
            : GetScalarType<T[P], MobilePushTokenGroupByOutputType[P]>
        }
      >
    >


  export type MobilePushTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    token?: boolean
    platform?: boolean
    provider?: boolean
    device_name?: boolean
    app_version?: boolean
    build_number?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_seen_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["mobilePushToken"]>

  export type MobilePushTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    token?: boolean
    platform?: boolean
    provider?: boolean
    device_name?: boolean
    app_version?: boolean
    build_number?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_seen_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["mobilePushToken"]>

  export type MobilePushTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    token?: boolean
    platform?: boolean
    provider?: boolean
    device_name?: boolean
    app_version?: boolean
    build_number?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_seen_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["mobilePushToken"]>

  export type MobilePushTokenSelectScalar = {
    id?: boolean
    user_id?: boolean
    token?: boolean
    platform?: boolean
    provider?: boolean
    device_name?: boolean
    app_version?: boolean
    build_number?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_seen_at?: boolean
  }

  export type MobilePushTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "token" | "platform" | "provider" | "device_name" | "app_version" | "build_number" | "created_at" | "updated_at" | "last_seen_at", ExtArgs["result"]["mobilePushToken"]>
  export type MobilePushTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MobilePushTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MobilePushTokenIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MobilePushTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MobilePushToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      token: string
      platform: string
      provider: string
      device_name: string | null
      app_version: string | null
      build_number: string | null
      created_at: Date
      updated_at: Date
      last_seen_at: Date
    }, ExtArgs["result"]["mobilePushToken"]>
    composites: {}
  }

  type MobilePushTokenGetPayload<S extends boolean | null | undefined | MobilePushTokenDefaultArgs> = $Result.GetResult<Prisma.$MobilePushTokenPayload, S>

  type MobilePushTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MobilePushTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MobilePushTokenCountAggregateInputType | true
    }

  export interface MobilePushTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MobilePushToken'], meta: { name: 'MobilePushToken' } }
    /**
     * Find zero or one MobilePushToken that matches the filter.
     * @param {MobilePushTokenFindUniqueArgs} args - Arguments to find a MobilePushToken
     * @example
     * // Get one MobilePushToken
     * const mobilePushToken = await prisma.mobilePushToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MobilePushTokenFindUniqueArgs>(args: SelectSubset<T, MobilePushTokenFindUniqueArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MobilePushToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MobilePushTokenFindUniqueOrThrowArgs} args - Arguments to find a MobilePushToken
     * @example
     * // Get one MobilePushToken
     * const mobilePushToken = await prisma.mobilePushToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MobilePushTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, MobilePushTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MobilePushToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenFindFirstArgs} args - Arguments to find a MobilePushToken
     * @example
     * // Get one MobilePushToken
     * const mobilePushToken = await prisma.mobilePushToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MobilePushTokenFindFirstArgs>(args?: SelectSubset<T, MobilePushTokenFindFirstArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MobilePushToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenFindFirstOrThrowArgs} args - Arguments to find a MobilePushToken
     * @example
     * // Get one MobilePushToken
     * const mobilePushToken = await prisma.mobilePushToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MobilePushTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, MobilePushTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MobilePushTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MobilePushTokens
     * const mobilePushTokens = await prisma.mobilePushToken.findMany()
     * 
     * // Get first 10 MobilePushTokens
     * const mobilePushTokens = await prisma.mobilePushToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const mobilePushTokenWithIdOnly = await prisma.mobilePushToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MobilePushTokenFindManyArgs>(args?: SelectSubset<T, MobilePushTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MobilePushToken.
     * @param {MobilePushTokenCreateArgs} args - Arguments to create a MobilePushToken.
     * @example
     * // Create one MobilePushToken
     * const MobilePushToken = await prisma.mobilePushToken.create({
     *   data: {
     *     // ... data to create a MobilePushToken
     *   }
     * })
     * 
     */
    create<T extends MobilePushTokenCreateArgs>(args: SelectSubset<T, MobilePushTokenCreateArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MobilePushTokens.
     * @param {MobilePushTokenCreateManyArgs} args - Arguments to create many MobilePushTokens.
     * @example
     * // Create many MobilePushTokens
     * const mobilePushToken = await prisma.mobilePushToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MobilePushTokenCreateManyArgs>(args?: SelectSubset<T, MobilePushTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MobilePushTokens and returns the data saved in the database.
     * @param {MobilePushTokenCreateManyAndReturnArgs} args - Arguments to create many MobilePushTokens.
     * @example
     * // Create many MobilePushTokens
     * const mobilePushToken = await prisma.mobilePushToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MobilePushTokens and only return the `id`
     * const mobilePushTokenWithIdOnly = await prisma.mobilePushToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MobilePushTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, MobilePushTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MobilePushToken.
     * @param {MobilePushTokenDeleteArgs} args - Arguments to delete one MobilePushToken.
     * @example
     * // Delete one MobilePushToken
     * const MobilePushToken = await prisma.mobilePushToken.delete({
     *   where: {
     *     // ... filter to delete one MobilePushToken
     *   }
     * })
     * 
     */
    delete<T extends MobilePushTokenDeleteArgs>(args: SelectSubset<T, MobilePushTokenDeleteArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MobilePushToken.
     * @param {MobilePushTokenUpdateArgs} args - Arguments to update one MobilePushToken.
     * @example
     * // Update one MobilePushToken
     * const mobilePushToken = await prisma.mobilePushToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MobilePushTokenUpdateArgs>(args: SelectSubset<T, MobilePushTokenUpdateArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MobilePushTokens.
     * @param {MobilePushTokenDeleteManyArgs} args - Arguments to filter MobilePushTokens to delete.
     * @example
     * // Delete a few MobilePushTokens
     * const { count } = await prisma.mobilePushToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MobilePushTokenDeleteManyArgs>(args?: SelectSubset<T, MobilePushTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MobilePushTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MobilePushTokens
     * const mobilePushToken = await prisma.mobilePushToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MobilePushTokenUpdateManyArgs>(args: SelectSubset<T, MobilePushTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MobilePushTokens and returns the data updated in the database.
     * @param {MobilePushTokenUpdateManyAndReturnArgs} args - Arguments to update many MobilePushTokens.
     * @example
     * // Update many MobilePushTokens
     * const mobilePushToken = await prisma.mobilePushToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MobilePushTokens and only return the `id`
     * const mobilePushTokenWithIdOnly = await prisma.mobilePushToken.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MobilePushTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, MobilePushTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MobilePushToken.
     * @param {MobilePushTokenUpsertArgs} args - Arguments to update or create a MobilePushToken.
     * @example
     * // Update or create a MobilePushToken
     * const mobilePushToken = await prisma.mobilePushToken.upsert({
     *   create: {
     *     // ... data to create a MobilePushToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MobilePushToken we want to update
     *   }
     * })
     */
    upsert<T extends MobilePushTokenUpsertArgs>(args: SelectSubset<T, MobilePushTokenUpsertArgs<ExtArgs>>): Prisma__MobilePushTokenClient<$Result.GetResult<Prisma.$MobilePushTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MobilePushTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenCountArgs} args - Arguments to filter MobilePushTokens to count.
     * @example
     * // Count the number of MobilePushTokens
     * const count = await prisma.mobilePushToken.count({
     *   where: {
     *     // ... the filter for the MobilePushTokens we want to count
     *   }
     * })
    **/
    count<T extends MobilePushTokenCountArgs>(
      args?: Subset<T, MobilePushTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MobilePushTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MobilePushToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MobilePushTokenAggregateArgs>(args: Subset<T, MobilePushTokenAggregateArgs>): Prisma.PrismaPromise<GetMobilePushTokenAggregateType<T>>

    /**
     * Group by MobilePushToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MobilePushTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MobilePushTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MobilePushTokenGroupByArgs['orderBy'] }
        : { orderBy?: MobilePushTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MobilePushTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMobilePushTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MobilePushToken model
   */
  readonly fields: MobilePushTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MobilePushToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MobilePushTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MobilePushToken model
   */
  interface MobilePushTokenFieldRefs {
    readonly id: FieldRef<"MobilePushToken", 'String'>
    readonly user_id: FieldRef<"MobilePushToken", 'String'>
    readonly token: FieldRef<"MobilePushToken", 'String'>
    readonly platform: FieldRef<"MobilePushToken", 'String'>
    readonly provider: FieldRef<"MobilePushToken", 'String'>
    readonly device_name: FieldRef<"MobilePushToken", 'String'>
    readonly app_version: FieldRef<"MobilePushToken", 'String'>
    readonly build_number: FieldRef<"MobilePushToken", 'String'>
    readonly created_at: FieldRef<"MobilePushToken", 'DateTime'>
    readonly updated_at: FieldRef<"MobilePushToken", 'DateTime'>
    readonly last_seen_at: FieldRef<"MobilePushToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MobilePushToken findUnique
   */
  export type MobilePushTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * Filter, which MobilePushToken to fetch.
     */
    where: MobilePushTokenWhereUniqueInput
  }

  /**
   * MobilePushToken findUniqueOrThrow
   */
  export type MobilePushTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * Filter, which MobilePushToken to fetch.
     */
    where: MobilePushTokenWhereUniqueInput
  }

  /**
   * MobilePushToken findFirst
   */
  export type MobilePushTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * Filter, which MobilePushToken to fetch.
     */
    where?: MobilePushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MobilePushTokens to fetch.
     */
    orderBy?: MobilePushTokenOrderByWithRelationInput | MobilePushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MobilePushTokens.
     */
    cursor?: MobilePushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MobilePushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MobilePushTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MobilePushTokens.
     */
    distinct?: MobilePushTokenScalarFieldEnum | MobilePushTokenScalarFieldEnum[]
  }

  /**
   * MobilePushToken findFirstOrThrow
   */
  export type MobilePushTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * Filter, which MobilePushToken to fetch.
     */
    where?: MobilePushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MobilePushTokens to fetch.
     */
    orderBy?: MobilePushTokenOrderByWithRelationInput | MobilePushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MobilePushTokens.
     */
    cursor?: MobilePushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MobilePushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MobilePushTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MobilePushTokens.
     */
    distinct?: MobilePushTokenScalarFieldEnum | MobilePushTokenScalarFieldEnum[]
  }

  /**
   * MobilePushToken findMany
   */
  export type MobilePushTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * Filter, which MobilePushTokens to fetch.
     */
    where?: MobilePushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MobilePushTokens to fetch.
     */
    orderBy?: MobilePushTokenOrderByWithRelationInput | MobilePushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MobilePushTokens.
     */
    cursor?: MobilePushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MobilePushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MobilePushTokens.
     */
    skip?: number
    distinct?: MobilePushTokenScalarFieldEnum | MobilePushTokenScalarFieldEnum[]
  }

  /**
   * MobilePushToken create
   */
  export type MobilePushTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a MobilePushToken.
     */
    data: XOR<MobilePushTokenCreateInput, MobilePushTokenUncheckedCreateInput>
  }

  /**
   * MobilePushToken createMany
   */
  export type MobilePushTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MobilePushTokens.
     */
    data: MobilePushTokenCreateManyInput | MobilePushTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MobilePushToken createManyAndReturn
   */
  export type MobilePushTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * The data used to create many MobilePushTokens.
     */
    data: MobilePushTokenCreateManyInput | MobilePushTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MobilePushToken update
   */
  export type MobilePushTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a MobilePushToken.
     */
    data: XOR<MobilePushTokenUpdateInput, MobilePushTokenUncheckedUpdateInput>
    /**
     * Choose, which MobilePushToken to update.
     */
    where: MobilePushTokenWhereUniqueInput
  }

  /**
   * MobilePushToken updateMany
   */
  export type MobilePushTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MobilePushTokens.
     */
    data: XOR<MobilePushTokenUpdateManyMutationInput, MobilePushTokenUncheckedUpdateManyInput>
    /**
     * Filter which MobilePushTokens to update
     */
    where?: MobilePushTokenWhereInput
    /**
     * Limit how many MobilePushTokens to update.
     */
    limit?: number
  }

  /**
   * MobilePushToken updateManyAndReturn
   */
  export type MobilePushTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * The data used to update MobilePushTokens.
     */
    data: XOR<MobilePushTokenUpdateManyMutationInput, MobilePushTokenUncheckedUpdateManyInput>
    /**
     * Filter which MobilePushTokens to update
     */
    where?: MobilePushTokenWhereInput
    /**
     * Limit how many MobilePushTokens to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MobilePushToken upsert
   */
  export type MobilePushTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the MobilePushToken to update in case it exists.
     */
    where: MobilePushTokenWhereUniqueInput
    /**
     * In case the MobilePushToken found by the `where` argument doesn't exist, create a new MobilePushToken with this data.
     */
    create: XOR<MobilePushTokenCreateInput, MobilePushTokenUncheckedCreateInput>
    /**
     * In case the MobilePushToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MobilePushTokenUpdateInput, MobilePushTokenUncheckedUpdateInput>
  }

  /**
   * MobilePushToken delete
   */
  export type MobilePushTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
    /**
     * Filter which MobilePushToken to delete.
     */
    where: MobilePushTokenWhereUniqueInput
  }

  /**
   * MobilePushToken deleteMany
   */
  export type MobilePushTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MobilePushTokens to delete
     */
    where?: MobilePushTokenWhereInput
    /**
     * Limit how many MobilePushTokens to delete.
     */
    limit?: number
  }

  /**
   * MobilePushToken without action
   */
  export type MobilePushTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MobilePushToken
     */
    select?: MobilePushTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MobilePushToken
     */
    omit?: MobilePushTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MobilePushTokenInclude<ExtArgs> | null
  }


  /**
   * Model PasswordResetToken
   */

  export type AggregatePasswordResetToken = {
    _count: PasswordResetTokenCountAggregateOutputType | null
    _min: PasswordResetTokenMinAggregateOutputType | null
    _max: PasswordResetTokenMaxAggregateOutputType | null
  }

  export type PasswordResetTokenMinAggregateOutputType = {
    id: string | null
    token_hash: string | null
    user_id: string | null
    expires_at: Date | null
    used_at: Date | null
    created_at: Date | null
  }

  export type PasswordResetTokenMaxAggregateOutputType = {
    id: string | null
    token_hash: string | null
    user_id: string | null
    expires_at: Date | null
    used_at: Date | null
    created_at: Date | null
  }

  export type PasswordResetTokenCountAggregateOutputType = {
    id: number
    token_hash: number
    user_id: number
    expires_at: number
    used_at: number
    created_at: number
    _all: number
  }


  export type PasswordResetTokenMinAggregateInputType = {
    id?: true
    token_hash?: true
    user_id?: true
    expires_at?: true
    used_at?: true
    created_at?: true
  }

  export type PasswordResetTokenMaxAggregateInputType = {
    id?: true
    token_hash?: true
    user_id?: true
    expires_at?: true
    used_at?: true
    created_at?: true
  }

  export type PasswordResetTokenCountAggregateInputType = {
    id?: true
    token_hash?: true
    user_id?: true
    expires_at?: true
    used_at?: true
    created_at?: true
    _all?: true
  }

  export type PasswordResetTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResetToken to aggregate.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PasswordResetTokens
    **/
    _count?: true | PasswordResetTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PasswordResetTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PasswordResetTokenMaxAggregateInputType
  }

  export type GetPasswordResetTokenAggregateType<T extends PasswordResetTokenAggregateArgs> = {
        [P in keyof T & keyof AggregatePasswordResetToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePasswordResetToken[P]>
      : GetScalarType<T[P], AggregatePasswordResetToken[P]>
  }




  export type PasswordResetTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetTokenWhereInput
    orderBy?: PasswordResetTokenOrderByWithAggregationInput | PasswordResetTokenOrderByWithAggregationInput[]
    by: PasswordResetTokenScalarFieldEnum[] | PasswordResetTokenScalarFieldEnum
    having?: PasswordResetTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PasswordResetTokenCountAggregateInputType | true
    _min?: PasswordResetTokenMinAggregateInputType
    _max?: PasswordResetTokenMaxAggregateInputType
  }

  export type PasswordResetTokenGroupByOutputType = {
    id: string
    token_hash: string
    user_id: string
    expires_at: Date
    used_at: Date | null
    created_at: Date
    _count: PasswordResetTokenCountAggregateOutputType | null
    _min: PasswordResetTokenMinAggregateOutputType | null
    _max: PasswordResetTokenMaxAggregateOutputType | null
  }

  type GetPasswordResetTokenGroupByPayload<T extends PasswordResetTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PasswordResetTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PasswordResetTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PasswordResetTokenGroupByOutputType[P]>
            : GetScalarType<T[P], PasswordResetTokenGroupByOutputType[P]>
        }
      >
    >


  export type PasswordResetTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token_hash?: boolean
    user_id?: boolean
    expires_at?: boolean
    used_at?: boolean
    created_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordResetToken"]>

  export type PasswordResetTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token_hash?: boolean
    user_id?: boolean
    expires_at?: boolean
    used_at?: boolean
    created_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordResetToken"]>

  export type PasswordResetTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token_hash?: boolean
    user_id?: boolean
    expires_at?: boolean
    used_at?: boolean
    created_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordResetToken"]>

  export type PasswordResetTokenSelectScalar = {
    id?: boolean
    token_hash?: boolean
    user_id?: boolean
    expires_at?: boolean
    used_at?: boolean
    created_at?: boolean
  }

  export type PasswordResetTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "token_hash" | "user_id" | "expires_at" | "used_at" | "created_at", ExtArgs["result"]["passwordResetToken"]>
  export type PasswordResetTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PasswordResetTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PasswordResetTokenIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PasswordResetTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PasswordResetToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      token_hash: string
      user_id: string
      expires_at: Date
      used_at: Date | null
      created_at: Date
    }, ExtArgs["result"]["passwordResetToken"]>
    composites: {}
  }

  type PasswordResetTokenGetPayload<S extends boolean | null | undefined | PasswordResetTokenDefaultArgs> = $Result.GetResult<Prisma.$PasswordResetTokenPayload, S>

  type PasswordResetTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PasswordResetTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PasswordResetTokenCountAggregateInputType | true
    }

  export interface PasswordResetTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PasswordResetToken'], meta: { name: 'PasswordResetToken' } }
    /**
     * Find zero or one PasswordResetToken that matches the filter.
     * @param {PasswordResetTokenFindUniqueArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PasswordResetTokenFindUniqueArgs>(args: SelectSubset<T, PasswordResetTokenFindUniqueArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PasswordResetToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PasswordResetTokenFindUniqueOrThrowArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PasswordResetTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordResetToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenFindFirstArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PasswordResetTokenFindFirstArgs>(args?: SelectSubset<T, PasswordResetTokenFindFirstArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordResetToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenFindFirstOrThrowArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PasswordResetTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, PasswordResetTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PasswordResetTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PasswordResetTokens
     * const passwordResetTokens = await prisma.passwordResetToken.findMany()
     * 
     * // Get first 10 PasswordResetTokens
     * const passwordResetTokens = await prisma.passwordResetToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const passwordResetTokenWithIdOnly = await prisma.passwordResetToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PasswordResetTokenFindManyArgs>(args?: SelectSubset<T, PasswordResetTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PasswordResetToken.
     * @param {PasswordResetTokenCreateArgs} args - Arguments to create a PasswordResetToken.
     * @example
     * // Create one PasswordResetToken
     * const PasswordResetToken = await prisma.passwordResetToken.create({
     *   data: {
     *     // ... data to create a PasswordResetToken
     *   }
     * })
     * 
     */
    create<T extends PasswordResetTokenCreateArgs>(args: SelectSubset<T, PasswordResetTokenCreateArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PasswordResetTokens.
     * @param {PasswordResetTokenCreateManyArgs} args - Arguments to create many PasswordResetTokens.
     * @example
     * // Create many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PasswordResetTokenCreateManyArgs>(args?: SelectSubset<T, PasswordResetTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PasswordResetTokens and returns the data saved in the database.
     * @param {PasswordResetTokenCreateManyAndReturnArgs} args - Arguments to create many PasswordResetTokens.
     * @example
     * // Create many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PasswordResetTokens and only return the `id`
     * const passwordResetTokenWithIdOnly = await prisma.passwordResetToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PasswordResetTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, PasswordResetTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PasswordResetToken.
     * @param {PasswordResetTokenDeleteArgs} args - Arguments to delete one PasswordResetToken.
     * @example
     * // Delete one PasswordResetToken
     * const PasswordResetToken = await prisma.passwordResetToken.delete({
     *   where: {
     *     // ... filter to delete one PasswordResetToken
     *   }
     * })
     * 
     */
    delete<T extends PasswordResetTokenDeleteArgs>(args: SelectSubset<T, PasswordResetTokenDeleteArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PasswordResetToken.
     * @param {PasswordResetTokenUpdateArgs} args - Arguments to update one PasswordResetToken.
     * @example
     * // Update one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PasswordResetTokenUpdateArgs>(args: SelectSubset<T, PasswordResetTokenUpdateArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PasswordResetTokens.
     * @param {PasswordResetTokenDeleteManyArgs} args - Arguments to filter PasswordResetTokens to delete.
     * @example
     * // Delete a few PasswordResetTokens
     * const { count } = await prisma.passwordResetToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PasswordResetTokenDeleteManyArgs>(args?: SelectSubset<T, PasswordResetTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PasswordResetTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PasswordResetTokenUpdateManyArgs>(args: SelectSubset<T, PasswordResetTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PasswordResetTokens and returns the data updated in the database.
     * @param {PasswordResetTokenUpdateManyAndReturnArgs} args - Arguments to update many PasswordResetTokens.
     * @example
     * // Update many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PasswordResetTokens and only return the `id`
     * const passwordResetTokenWithIdOnly = await prisma.passwordResetToken.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PasswordResetTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PasswordResetToken.
     * @param {PasswordResetTokenUpsertArgs} args - Arguments to update or create a PasswordResetToken.
     * @example
     * // Update or create a PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.upsert({
     *   create: {
     *     // ... data to create a PasswordResetToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PasswordResetToken we want to update
     *   }
     * })
     */
    upsert<T extends PasswordResetTokenUpsertArgs>(args: SelectSubset<T, PasswordResetTokenUpsertArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PasswordResetTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenCountArgs} args - Arguments to filter PasswordResetTokens to count.
     * @example
     * // Count the number of PasswordResetTokens
     * const count = await prisma.passwordResetToken.count({
     *   where: {
     *     // ... the filter for the PasswordResetTokens we want to count
     *   }
     * })
    **/
    count<T extends PasswordResetTokenCountArgs>(
      args?: Subset<T, PasswordResetTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PasswordResetTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PasswordResetToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PasswordResetTokenAggregateArgs>(args: Subset<T, PasswordResetTokenAggregateArgs>): Prisma.PrismaPromise<GetPasswordResetTokenAggregateType<T>>

    /**
     * Group by PasswordResetToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PasswordResetTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PasswordResetTokenGroupByArgs['orderBy'] }
        : { orderBy?: PasswordResetTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PasswordResetTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPasswordResetTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PasswordResetToken model
   */
  readonly fields: PasswordResetTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PasswordResetToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PasswordResetTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PasswordResetToken model
   */
  interface PasswordResetTokenFieldRefs {
    readonly id: FieldRef<"PasswordResetToken", 'String'>
    readonly token_hash: FieldRef<"PasswordResetToken", 'String'>
    readonly user_id: FieldRef<"PasswordResetToken", 'String'>
    readonly expires_at: FieldRef<"PasswordResetToken", 'DateTime'>
    readonly used_at: FieldRef<"PasswordResetToken", 'DateTime'>
    readonly created_at: FieldRef<"PasswordResetToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PasswordResetToken findUnique
   */
  export type PasswordResetTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken findUniqueOrThrow
   */
  export type PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken findFirst
   */
  export type PasswordResetTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PasswordResetTokens.
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PasswordResetTokens.
     */
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * PasswordResetToken findFirstOrThrow
   */
  export type PasswordResetTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PasswordResetTokens.
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PasswordResetTokens.
     */
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * PasswordResetToken findMany
   */
  export type PasswordResetTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetTokens to fetch.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PasswordResetTokens.
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * PasswordResetToken create
   */
  export type PasswordResetTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a PasswordResetToken.
     */
    data: XOR<PasswordResetTokenCreateInput, PasswordResetTokenUncheckedCreateInput>
  }

  /**
   * PasswordResetToken createMany
   */
  export type PasswordResetTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PasswordResetTokens.
     */
    data: PasswordResetTokenCreateManyInput | PasswordResetTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PasswordResetToken createManyAndReturn
   */
  export type PasswordResetTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * The data used to create many PasswordResetTokens.
     */
    data: PasswordResetTokenCreateManyInput | PasswordResetTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PasswordResetToken update
   */
  export type PasswordResetTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a PasswordResetToken.
     */
    data: XOR<PasswordResetTokenUpdateInput, PasswordResetTokenUncheckedUpdateInput>
    /**
     * Choose, which PasswordResetToken to update.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken updateMany
   */
  export type PasswordResetTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PasswordResetTokens.
     */
    data: XOR<PasswordResetTokenUpdateManyMutationInput, PasswordResetTokenUncheckedUpdateManyInput>
    /**
     * Filter which PasswordResetTokens to update
     */
    where?: PasswordResetTokenWhereInput
    /**
     * Limit how many PasswordResetTokens to update.
     */
    limit?: number
  }

  /**
   * PasswordResetToken updateManyAndReturn
   */
  export type PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * The data used to update PasswordResetTokens.
     */
    data: XOR<PasswordResetTokenUpdateManyMutationInput, PasswordResetTokenUncheckedUpdateManyInput>
    /**
     * Filter which PasswordResetTokens to update
     */
    where?: PasswordResetTokenWhereInput
    /**
     * Limit how many PasswordResetTokens to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PasswordResetToken upsert
   */
  export type PasswordResetTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the PasswordResetToken to update in case it exists.
     */
    where: PasswordResetTokenWhereUniqueInput
    /**
     * In case the PasswordResetToken found by the `where` argument doesn't exist, create a new PasswordResetToken with this data.
     */
    create: XOR<PasswordResetTokenCreateInput, PasswordResetTokenUncheckedCreateInput>
    /**
     * In case the PasswordResetToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PasswordResetTokenUpdateInput, PasswordResetTokenUncheckedUpdateInput>
  }

  /**
   * PasswordResetToken delete
   */
  export type PasswordResetTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter which PasswordResetToken to delete.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken deleteMany
   */
  export type PasswordResetTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResetTokens to delete
     */
    where?: PasswordResetTokenWhereInput
    /**
     * Limit how many PasswordResetTokens to delete.
     */
    limit?: number
  }

  /**
   * PasswordResetToken without action
   */
  export type PasswordResetTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
  }


  /**
   * Model UserOrganization
   */

  export type AggregateUserOrganization = {
    _count: UserOrganizationCountAggregateOutputType | null
    _min: UserOrganizationMinAggregateOutputType | null
    _max: UserOrganizationMaxAggregateOutputType | null
  }

  export type UserOrganizationMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    organization_id: string | null
    store_id: string | null
    role: $Enums.Role | null
    approved: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type UserOrganizationMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    organization_id: string | null
    store_id: string | null
    role: $Enums.Role | null
    approved: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type UserOrganizationCountAggregateOutputType = {
    id: number
    user_id: number
    organization_id: number
    store_id: number
    role: number
    permissions: number
    approved: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type UserOrganizationMinAggregateInputType = {
    id?: true
    user_id?: true
    organization_id?: true
    store_id?: true
    role?: true
    approved?: true
    created_at?: true
    updated_at?: true
  }

  export type UserOrganizationMaxAggregateInputType = {
    id?: true
    user_id?: true
    organization_id?: true
    store_id?: true
    role?: true
    approved?: true
    created_at?: true
    updated_at?: true
  }

  export type UserOrganizationCountAggregateInputType = {
    id?: true
    user_id?: true
    organization_id?: true
    store_id?: true
    role?: true
    permissions?: true
    approved?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type UserOrganizationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserOrganization to aggregate.
     */
    where?: UserOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserOrganizations to fetch.
     */
    orderBy?: UserOrganizationOrderByWithRelationInput | UserOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserOrganizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserOrganizations
    **/
    _count?: true | UserOrganizationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserOrganizationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserOrganizationMaxAggregateInputType
  }

  export type GetUserOrganizationAggregateType<T extends UserOrganizationAggregateArgs> = {
        [P in keyof T & keyof AggregateUserOrganization]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserOrganization[P]>
      : GetScalarType<T[P], AggregateUserOrganization[P]>
  }




  export type UserOrganizationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserOrganizationWhereInput
    orderBy?: UserOrganizationOrderByWithAggregationInput | UserOrganizationOrderByWithAggregationInput[]
    by: UserOrganizationScalarFieldEnum[] | UserOrganizationScalarFieldEnum
    having?: UserOrganizationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserOrganizationCountAggregateInputType | true
    _min?: UserOrganizationMinAggregateInputType
    _max?: UserOrganizationMaxAggregateInputType
  }

  export type UserOrganizationGroupByOutputType = {
    id: string
    user_id: string
    organization_id: string
    store_id: string
    role: $Enums.Role
    permissions: $Enums.Permission[]
    approved: boolean
    created_at: Date
    updated_at: Date
    _count: UserOrganizationCountAggregateOutputType | null
    _min: UserOrganizationMinAggregateOutputType | null
    _max: UserOrganizationMaxAggregateOutputType | null
  }

  type GetUserOrganizationGroupByPayload<T extends UserOrganizationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserOrganizationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserOrganizationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserOrganizationGroupByOutputType[P]>
            : GetScalarType<T[P], UserOrganizationGroupByOutputType[P]>
        }
      >
    >


  export type UserOrganizationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    organization_id?: boolean
    store_id?: boolean
    role?: boolean
    permissions?: boolean
    approved?: boolean
    created_at?: boolean
    updated_at?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userOrganization"]>

  export type UserOrganizationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    organization_id?: boolean
    store_id?: boolean
    role?: boolean
    permissions?: boolean
    approved?: boolean
    created_at?: boolean
    updated_at?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userOrganization"]>

  export type UserOrganizationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    organization_id?: boolean
    store_id?: boolean
    role?: boolean
    permissions?: boolean
    approved?: boolean
    created_at?: boolean
    updated_at?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userOrganization"]>

  export type UserOrganizationSelectScalar = {
    id?: boolean
    user_id?: boolean
    organization_id?: boolean
    store_id?: boolean
    role?: boolean
    permissions?: boolean
    approved?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type UserOrganizationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "organization_id" | "store_id" | "role" | "permissions" | "approved" | "created_at" | "updated_at", ExtArgs["result"]["userOrganization"]>
  export type UserOrganizationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }
  export type UserOrganizationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }
  export type UserOrganizationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }

  export type $UserOrganizationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserOrganization"
    objects: {
      organization: Prisma.$OrganizationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      organization_id: string
      store_id: string
      role: $Enums.Role
      permissions: $Enums.Permission[]
      approved: boolean
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["userOrganization"]>
    composites: {}
  }

  type UserOrganizationGetPayload<S extends boolean | null | undefined | UserOrganizationDefaultArgs> = $Result.GetResult<Prisma.$UserOrganizationPayload, S>

  type UserOrganizationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserOrganizationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserOrganizationCountAggregateInputType | true
    }

  export interface UserOrganizationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserOrganization'], meta: { name: 'UserOrganization' } }
    /**
     * Find zero or one UserOrganization that matches the filter.
     * @param {UserOrganizationFindUniqueArgs} args - Arguments to find a UserOrganization
     * @example
     * // Get one UserOrganization
     * const userOrganization = await prisma.userOrganization.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserOrganizationFindUniqueArgs>(args: SelectSubset<T, UserOrganizationFindUniqueArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserOrganization that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserOrganizationFindUniqueOrThrowArgs} args - Arguments to find a UserOrganization
     * @example
     * // Get one UserOrganization
     * const userOrganization = await prisma.userOrganization.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserOrganizationFindUniqueOrThrowArgs>(args: SelectSubset<T, UserOrganizationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserOrganization that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationFindFirstArgs} args - Arguments to find a UserOrganization
     * @example
     * // Get one UserOrganization
     * const userOrganization = await prisma.userOrganization.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserOrganizationFindFirstArgs>(args?: SelectSubset<T, UserOrganizationFindFirstArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserOrganization that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationFindFirstOrThrowArgs} args - Arguments to find a UserOrganization
     * @example
     * // Get one UserOrganization
     * const userOrganization = await prisma.userOrganization.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserOrganizationFindFirstOrThrowArgs>(args?: SelectSubset<T, UserOrganizationFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserOrganizations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserOrganizations
     * const userOrganizations = await prisma.userOrganization.findMany()
     * 
     * // Get first 10 UserOrganizations
     * const userOrganizations = await prisma.userOrganization.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userOrganizationWithIdOnly = await prisma.userOrganization.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserOrganizationFindManyArgs>(args?: SelectSubset<T, UserOrganizationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserOrganization.
     * @param {UserOrganizationCreateArgs} args - Arguments to create a UserOrganization.
     * @example
     * // Create one UserOrganization
     * const UserOrganization = await prisma.userOrganization.create({
     *   data: {
     *     // ... data to create a UserOrganization
     *   }
     * })
     * 
     */
    create<T extends UserOrganizationCreateArgs>(args: SelectSubset<T, UserOrganizationCreateArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserOrganizations.
     * @param {UserOrganizationCreateManyArgs} args - Arguments to create many UserOrganizations.
     * @example
     * // Create many UserOrganizations
     * const userOrganization = await prisma.userOrganization.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserOrganizationCreateManyArgs>(args?: SelectSubset<T, UserOrganizationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserOrganizations and returns the data saved in the database.
     * @param {UserOrganizationCreateManyAndReturnArgs} args - Arguments to create many UserOrganizations.
     * @example
     * // Create many UserOrganizations
     * const userOrganization = await prisma.userOrganization.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserOrganizations and only return the `id`
     * const userOrganizationWithIdOnly = await prisma.userOrganization.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserOrganizationCreateManyAndReturnArgs>(args?: SelectSubset<T, UserOrganizationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserOrganization.
     * @param {UserOrganizationDeleteArgs} args - Arguments to delete one UserOrganization.
     * @example
     * // Delete one UserOrganization
     * const UserOrganization = await prisma.userOrganization.delete({
     *   where: {
     *     // ... filter to delete one UserOrganization
     *   }
     * })
     * 
     */
    delete<T extends UserOrganizationDeleteArgs>(args: SelectSubset<T, UserOrganizationDeleteArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserOrganization.
     * @param {UserOrganizationUpdateArgs} args - Arguments to update one UserOrganization.
     * @example
     * // Update one UserOrganization
     * const userOrganization = await prisma.userOrganization.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserOrganizationUpdateArgs>(args: SelectSubset<T, UserOrganizationUpdateArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserOrganizations.
     * @param {UserOrganizationDeleteManyArgs} args - Arguments to filter UserOrganizations to delete.
     * @example
     * // Delete a few UserOrganizations
     * const { count } = await prisma.userOrganization.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserOrganizationDeleteManyArgs>(args?: SelectSubset<T, UserOrganizationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserOrganizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserOrganizations
     * const userOrganization = await prisma.userOrganization.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserOrganizationUpdateManyArgs>(args: SelectSubset<T, UserOrganizationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserOrganizations and returns the data updated in the database.
     * @param {UserOrganizationUpdateManyAndReturnArgs} args - Arguments to update many UserOrganizations.
     * @example
     * // Update many UserOrganizations
     * const userOrganization = await prisma.userOrganization.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserOrganizations and only return the `id`
     * const userOrganizationWithIdOnly = await prisma.userOrganization.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserOrganizationUpdateManyAndReturnArgs>(args: SelectSubset<T, UserOrganizationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserOrganization.
     * @param {UserOrganizationUpsertArgs} args - Arguments to update or create a UserOrganization.
     * @example
     * // Update or create a UserOrganization
     * const userOrganization = await prisma.userOrganization.upsert({
     *   create: {
     *     // ... data to create a UserOrganization
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserOrganization we want to update
     *   }
     * })
     */
    upsert<T extends UserOrganizationUpsertArgs>(args: SelectSubset<T, UserOrganizationUpsertArgs<ExtArgs>>): Prisma__UserOrganizationClient<$Result.GetResult<Prisma.$UserOrganizationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserOrganizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationCountArgs} args - Arguments to filter UserOrganizations to count.
     * @example
     * // Count the number of UserOrganizations
     * const count = await prisma.userOrganization.count({
     *   where: {
     *     // ... the filter for the UserOrganizations we want to count
     *   }
     * })
    **/
    count<T extends UserOrganizationCountArgs>(
      args?: Subset<T, UserOrganizationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserOrganizationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserOrganization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserOrganizationAggregateArgs>(args: Subset<T, UserOrganizationAggregateArgs>): Prisma.PrismaPromise<GetUserOrganizationAggregateType<T>>

    /**
     * Group by UserOrganization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserOrganizationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserOrganizationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserOrganizationGroupByArgs['orderBy'] }
        : { orderBy?: UserOrganizationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserOrganizationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserOrganizationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserOrganization model
   */
  readonly fields: UserOrganizationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserOrganization.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserOrganizationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    organization<T extends OrganizationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrganizationDefaultArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserOrganization model
   */
  interface UserOrganizationFieldRefs {
    readonly id: FieldRef<"UserOrganization", 'String'>
    readonly user_id: FieldRef<"UserOrganization", 'String'>
    readonly organization_id: FieldRef<"UserOrganization", 'String'>
    readonly store_id: FieldRef<"UserOrganization", 'String'>
    readonly role: FieldRef<"UserOrganization", 'Role'>
    readonly permissions: FieldRef<"UserOrganization", 'Permission[]'>
    readonly approved: FieldRef<"UserOrganization", 'Boolean'>
    readonly created_at: FieldRef<"UserOrganization", 'DateTime'>
    readonly updated_at: FieldRef<"UserOrganization", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserOrganization findUnique
   */
  export type UserOrganizationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which UserOrganization to fetch.
     */
    where: UserOrganizationWhereUniqueInput
  }

  /**
   * UserOrganization findUniqueOrThrow
   */
  export type UserOrganizationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which UserOrganization to fetch.
     */
    where: UserOrganizationWhereUniqueInput
  }

  /**
   * UserOrganization findFirst
   */
  export type UserOrganizationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which UserOrganization to fetch.
     */
    where?: UserOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserOrganizations to fetch.
     */
    orderBy?: UserOrganizationOrderByWithRelationInput | UserOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserOrganizations.
     */
    cursor?: UserOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserOrganizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserOrganizations.
     */
    distinct?: UserOrganizationScalarFieldEnum | UserOrganizationScalarFieldEnum[]
  }

  /**
   * UserOrganization findFirstOrThrow
   */
  export type UserOrganizationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which UserOrganization to fetch.
     */
    where?: UserOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserOrganizations to fetch.
     */
    orderBy?: UserOrganizationOrderByWithRelationInput | UserOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserOrganizations.
     */
    cursor?: UserOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserOrganizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserOrganizations.
     */
    distinct?: UserOrganizationScalarFieldEnum | UserOrganizationScalarFieldEnum[]
  }

  /**
   * UserOrganization findMany
   */
  export type UserOrganizationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which UserOrganizations to fetch.
     */
    where?: UserOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserOrganizations to fetch.
     */
    orderBy?: UserOrganizationOrderByWithRelationInput | UserOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserOrganizations.
     */
    cursor?: UserOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserOrganizations.
     */
    skip?: number
    distinct?: UserOrganizationScalarFieldEnum | UserOrganizationScalarFieldEnum[]
  }

  /**
   * UserOrganization create
   */
  export type UserOrganizationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * The data needed to create a UserOrganization.
     */
    data: XOR<UserOrganizationCreateInput, UserOrganizationUncheckedCreateInput>
  }

  /**
   * UserOrganization createMany
   */
  export type UserOrganizationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserOrganizations.
     */
    data: UserOrganizationCreateManyInput | UserOrganizationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserOrganization createManyAndReturn
   */
  export type UserOrganizationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * The data used to create many UserOrganizations.
     */
    data: UserOrganizationCreateManyInput | UserOrganizationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserOrganization update
   */
  export type UserOrganizationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * The data needed to update a UserOrganization.
     */
    data: XOR<UserOrganizationUpdateInput, UserOrganizationUncheckedUpdateInput>
    /**
     * Choose, which UserOrganization to update.
     */
    where: UserOrganizationWhereUniqueInput
  }

  /**
   * UserOrganization updateMany
   */
  export type UserOrganizationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserOrganizations.
     */
    data: XOR<UserOrganizationUpdateManyMutationInput, UserOrganizationUncheckedUpdateManyInput>
    /**
     * Filter which UserOrganizations to update
     */
    where?: UserOrganizationWhereInput
    /**
     * Limit how many UserOrganizations to update.
     */
    limit?: number
  }

  /**
   * UserOrganization updateManyAndReturn
   */
  export type UserOrganizationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * The data used to update UserOrganizations.
     */
    data: XOR<UserOrganizationUpdateManyMutationInput, UserOrganizationUncheckedUpdateManyInput>
    /**
     * Filter which UserOrganizations to update
     */
    where?: UserOrganizationWhereInput
    /**
     * Limit how many UserOrganizations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserOrganization upsert
   */
  export type UserOrganizationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * The filter to search for the UserOrganization to update in case it exists.
     */
    where: UserOrganizationWhereUniqueInput
    /**
     * In case the UserOrganization found by the `where` argument doesn't exist, create a new UserOrganization with this data.
     */
    create: XOR<UserOrganizationCreateInput, UserOrganizationUncheckedCreateInput>
    /**
     * In case the UserOrganization was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserOrganizationUpdateInput, UserOrganizationUncheckedUpdateInput>
  }

  /**
   * UserOrganization delete
   */
  export type UserOrganizationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
    /**
     * Filter which UserOrganization to delete.
     */
    where: UserOrganizationWhereUniqueInput
  }

  /**
   * UserOrganization deleteMany
   */
  export type UserOrganizationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserOrganizations to delete
     */
    where?: UserOrganizationWhereInput
    /**
     * Limit how many UserOrganizations to delete.
     */
    limit?: number
  }

  /**
   * UserOrganization without action
   */
  export type UserOrganizationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserOrganization
     */
    select?: UserOrganizationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserOrganization
     */
    omit?: UserOrganizationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserOrganizationInclude<ExtArgs> | null
  }


  /**
   * Model StoreInvite
   */

  export type AggregateStoreInvite = {
    _count: StoreInviteCountAggregateOutputType | null
    _min: StoreInviteMinAggregateOutputType | null
    _max: StoreInviteMaxAggregateOutputType | null
  }

  export type StoreInviteMinAggregateOutputType = {
    id: string | null
    organization_id: string | null
    store_id: string | null
    token_hash: string | null
    expires_at: Date | null
    used_at: Date | null
    revoked_at: Date | null
    created_by: string | null
    created_at: Date | null
  }

  export type StoreInviteMaxAggregateOutputType = {
    id: string | null
    organization_id: string | null
    store_id: string | null
    token_hash: string | null
    expires_at: Date | null
    used_at: Date | null
    revoked_at: Date | null
    created_by: string | null
    created_at: Date | null
  }

  export type StoreInviteCountAggregateOutputType = {
    id: number
    organization_id: number
    store_id: number
    token_hash: number
    expires_at: number
    used_at: number
    revoked_at: number
    created_by: number
    created_at: number
    _all: number
  }


  export type StoreInviteMinAggregateInputType = {
    id?: true
    organization_id?: true
    store_id?: true
    token_hash?: true
    expires_at?: true
    used_at?: true
    revoked_at?: true
    created_by?: true
    created_at?: true
  }

  export type StoreInviteMaxAggregateInputType = {
    id?: true
    organization_id?: true
    store_id?: true
    token_hash?: true
    expires_at?: true
    used_at?: true
    revoked_at?: true
    created_by?: true
    created_at?: true
  }

  export type StoreInviteCountAggregateInputType = {
    id?: true
    organization_id?: true
    store_id?: true
    token_hash?: true
    expires_at?: true
    used_at?: true
    revoked_at?: true
    created_by?: true
    created_at?: true
    _all?: true
  }

  export type StoreInviteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoreInvite to aggregate.
     */
    where?: StoreInviteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreInvites to fetch.
     */
    orderBy?: StoreInviteOrderByWithRelationInput | StoreInviteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StoreInviteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreInvites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreInvites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StoreInvites
    **/
    _count?: true | StoreInviteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StoreInviteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StoreInviteMaxAggregateInputType
  }

  export type GetStoreInviteAggregateType<T extends StoreInviteAggregateArgs> = {
        [P in keyof T & keyof AggregateStoreInvite]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStoreInvite[P]>
      : GetScalarType<T[P], AggregateStoreInvite[P]>
  }




  export type StoreInviteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoreInviteWhereInput
    orderBy?: StoreInviteOrderByWithAggregationInput | StoreInviteOrderByWithAggregationInput[]
    by: StoreInviteScalarFieldEnum[] | StoreInviteScalarFieldEnum
    having?: StoreInviteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StoreInviteCountAggregateInputType | true
    _min?: StoreInviteMinAggregateInputType
    _max?: StoreInviteMaxAggregateInputType
  }

  export type StoreInviteGroupByOutputType = {
    id: string
    organization_id: string
    store_id: string
    token_hash: string
    expires_at: Date
    used_at: Date | null
    revoked_at: Date | null
    created_by: string
    created_at: Date
    _count: StoreInviteCountAggregateOutputType | null
    _min: StoreInviteMinAggregateOutputType | null
    _max: StoreInviteMaxAggregateOutputType | null
  }

  type GetStoreInviteGroupByPayload<T extends StoreInviteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StoreInviteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StoreInviteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StoreInviteGroupByOutputType[P]>
            : GetScalarType<T[P], StoreInviteGroupByOutputType[P]>
        }
      >
    >


  export type StoreInviteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organization_id?: boolean
    store_id?: boolean
    token_hash?: boolean
    expires_at?: boolean
    used_at?: boolean
    revoked_at?: boolean
    created_by?: boolean
    created_at?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storeInvite"]>

  export type StoreInviteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organization_id?: boolean
    store_id?: boolean
    token_hash?: boolean
    expires_at?: boolean
    used_at?: boolean
    revoked_at?: boolean
    created_by?: boolean
    created_at?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storeInvite"]>

  export type StoreInviteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organization_id?: boolean
    store_id?: boolean
    token_hash?: boolean
    expires_at?: boolean
    used_at?: boolean
    revoked_at?: boolean
    created_by?: boolean
    created_at?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["storeInvite"]>

  export type StoreInviteSelectScalar = {
    id?: boolean
    organization_id?: boolean
    store_id?: boolean
    token_hash?: boolean
    expires_at?: boolean
    used_at?: boolean
    revoked_at?: boolean
    created_by?: boolean
    created_at?: boolean
  }

  export type StoreInviteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "organization_id" | "store_id" | "token_hash" | "expires_at" | "used_at" | "revoked_at" | "created_by" | "created_at", ExtArgs["result"]["storeInvite"]>
  export type StoreInviteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }
  export type StoreInviteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }
  export type StoreInviteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }

  export type $StoreInvitePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StoreInvite"
    objects: {
      organization: Prisma.$OrganizationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      organization_id: string
      store_id: string
      token_hash: string
      expires_at: Date
      used_at: Date | null
      revoked_at: Date | null
      created_by: string
      created_at: Date
    }, ExtArgs["result"]["storeInvite"]>
    composites: {}
  }

  type StoreInviteGetPayload<S extends boolean | null | undefined | StoreInviteDefaultArgs> = $Result.GetResult<Prisma.$StoreInvitePayload, S>

  type StoreInviteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StoreInviteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StoreInviteCountAggregateInputType | true
    }

  export interface StoreInviteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StoreInvite'], meta: { name: 'StoreInvite' } }
    /**
     * Find zero or one StoreInvite that matches the filter.
     * @param {StoreInviteFindUniqueArgs} args - Arguments to find a StoreInvite
     * @example
     * // Get one StoreInvite
     * const storeInvite = await prisma.storeInvite.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StoreInviteFindUniqueArgs>(args: SelectSubset<T, StoreInviteFindUniqueArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StoreInvite that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StoreInviteFindUniqueOrThrowArgs} args - Arguments to find a StoreInvite
     * @example
     * // Get one StoreInvite
     * const storeInvite = await prisma.storeInvite.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StoreInviteFindUniqueOrThrowArgs>(args: SelectSubset<T, StoreInviteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StoreInvite that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteFindFirstArgs} args - Arguments to find a StoreInvite
     * @example
     * // Get one StoreInvite
     * const storeInvite = await prisma.storeInvite.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StoreInviteFindFirstArgs>(args?: SelectSubset<T, StoreInviteFindFirstArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StoreInvite that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteFindFirstOrThrowArgs} args - Arguments to find a StoreInvite
     * @example
     * // Get one StoreInvite
     * const storeInvite = await prisma.storeInvite.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StoreInviteFindFirstOrThrowArgs>(args?: SelectSubset<T, StoreInviteFindFirstOrThrowArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StoreInvites that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StoreInvites
     * const storeInvites = await prisma.storeInvite.findMany()
     * 
     * // Get first 10 StoreInvites
     * const storeInvites = await prisma.storeInvite.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const storeInviteWithIdOnly = await prisma.storeInvite.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StoreInviteFindManyArgs>(args?: SelectSubset<T, StoreInviteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StoreInvite.
     * @param {StoreInviteCreateArgs} args - Arguments to create a StoreInvite.
     * @example
     * // Create one StoreInvite
     * const StoreInvite = await prisma.storeInvite.create({
     *   data: {
     *     // ... data to create a StoreInvite
     *   }
     * })
     * 
     */
    create<T extends StoreInviteCreateArgs>(args: SelectSubset<T, StoreInviteCreateArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StoreInvites.
     * @param {StoreInviteCreateManyArgs} args - Arguments to create many StoreInvites.
     * @example
     * // Create many StoreInvites
     * const storeInvite = await prisma.storeInvite.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StoreInviteCreateManyArgs>(args?: SelectSubset<T, StoreInviteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StoreInvites and returns the data saved in the database.
     * @param {StoreInviteCreateManyAndReturnArgs} args - Arguments to create many StoreInvites.
     * @example
     * // Create many StoreInvites
     * const storeInvite = await prisma.storeInvite.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StoreInvites and only return the `id`
     * const storeInviteWithIdOnly = await prisma.storeInvite.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StoreInviteCreateManyAndReturnArgs>(args?: SelectSubset<T, StoreInviteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a StoreInvite.
     * @param {StoreInviteDeleteArgs} args - Arguments to delete one StoreInvite.
     * @example
     * // Delete one StoreInvite
     * const StoreInvite = await prisma.storeInvite.delete({
     *   where: {
     *     // ... filter to delete one StoreInvite
     *   }
     * })
     * 
     */
    delete<T extends StoreInviteDeleteArgs>(args: SelectSubset<T, StoreInviteDeleteArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StoreInvite.
     * @param {StoreInviteUpdateArgs} args - Arguments to update one StoreInvite.
     * @example
     * // Update one StoreInvite
     * const storeInvite = await prisma.storeInvite.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StoreInviteUpdateArgs>(args: SelectSubset<T, StoreInviteUpdateArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StoreInvites.
     * @param {StoreInviteDeleteManyArgs} args - Arguments to filter StoreInvites to delete.
     * @example
     * // Delete a few StoreInvites
     * const { count } = await prisma.storeInvite.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StoreInviteDeleteManyArgs>(args?: SelectSubset<T, StoreInviteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoreInvites.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StoreInvites
     * const storeInvite = await prisma.storeInvite.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StoreInviteUpdateManyArgs>(args: SelectSubset<T, StoreInviteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoreInvites and returns the data updated in the database.
     * @param {StoreInviteUpdateManyAndReturnArgs} args - Arguments to update many StoreInvites.
     * @example
     * // Update many StoreInvites
     * const storeInvite = await prisma.storeInvite.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more StoreInvites and only return the `id`
     * const storeInviteWithIdOnly = await prisma.storeInvite.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends StoreInviteUpdateManyAndReturnArgs>(args: SelectSubset<T, StoreInviteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one StoreInvite.
     * @param {StoreInviteUpsertArgs} args - Arguments to update or create a StoreInvite.
     * @example
     * // Update or create a StoreInvite
     * const storeInvite = await prisma.storeInvite.upsert({
     *   create: {
     *     // ... data to create a StoreInvite
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StoreInvite we want to update
     *   }
     * })
     */
    upsert<T extends StoreInviteUpsertArgs>(args: SelectSubset<T, StoreInviteUpsertArgs<ExtArgs>>): Prisma__StoreInviteClient<$Result.GetResult<Prisma.$StoreInvitePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of StoreInvites.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteCountArgs} args - Arguments to filter StoreInvites to count.
     * @example
     * // Count the number of StoreInvites
     * const count = await prisma.storeInvite.count({
     *   where: {
     *     // ... the filter for the StoreInvites we want to count
     *   }
     * })
    **/
    count<T extends StoreInviteCountArgs>(
      args?: Subset<T, StoreInviteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StoreInviteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StoreInvite.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StoreInviteAggregateArgs>(args: Subset<T, StoreInviteAggregateArgs>): Prisma.PrismaPromise<GetStoreInviteAggregateType<T>>

    /**
     * Group by StoreInvite.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreInviteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StoreInviteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StoreInviteGroupByArgs['orderBy'] }
        : { orderBy?: StoreInviteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StoreInviteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoreInviteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StoreInvite model
   */
  readonly fields: StoreInviteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StoreInvite.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StoreInviteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    organization<T extends OrganizationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrganizationDefaultArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StoreInvite model
   */
  interface StoreInviteFieldRefs {
    readonly id: FieldRef<"StoreInvite", 'String'>
    readonly organization_id: FieldRef<"StoreInvite", 'String'>
    readonly store_id: FieldRef<"StoreInvite", 'String'>
    readonly token_hash: FieldRef<"StoreInvite", 'String'>
    readonly expires_at: FieldRef<"StoreInvite", 'DateTime'>
    readonly used_at: FieldRef<"StoreInvite", 'DateTime'>
    readonly revoked_at: FieldRef<"StoreInvite", 'DateTime'>
    readonly created_by: FieldRef<"StoreInvite", 'String'>
    readonly created_at: FieldRef<"StoreInvite", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StoreInvite findUnique
   */
  export type StoreInviteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * Filter, which StoreInvite to fetch.
     */
    where: StoreInviteWhereUniqueInput
  }

  /**
   * StoreInvite findUniqueOrThrow
   */
  export type StoreInviteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * Filter, which StoreInvite to fetch.
     */
    where: StoreInviteWhereUniqueInput
  }

  /**
   * StoreInvite findFirst
   */
  export type StoreInviteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * Filter, which StoreInvite to fetch.
     */
    where?: StoreInviteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreInvites to fetch.
     */
    orderBy?: StoreInviteOrderByWithRelationInput | StoreInviteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoreInvites.
     */
    cursor?: StoreInviteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreInvites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreInvites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoreInvites.
     */
    distinct?: StoreInviteScalarFieldEnum | StoreInviteScalarFieldEnum[]
  }

  /**
   * StoreInvite findFirstOrThrow
   */
  export type StoreInviteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * Filter, which StoreInvite to fetch.
     */
    where?: StoreInviteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreInvites to fetch.
     */
    orderBy?: StoreInviteOrderByWithRelationInput | StoreInviteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoreInvites.
     */
    cursor?: StoreInviteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreInvites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreInvites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoreInvites.
     */
    distinct?: StoreInviteScalarFieldEnum | StoreInviteScalarFieldEnum[]
  }

  /**
   * StoreInvite findMany
   */
  export type StoreInviteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * Filter, which StoreInvites to fetch.
     */
    where?: StoreInviteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreInvites to fetch.
     */
    orderBy?: StoreInviteOrderByWithRelationInput | StoreInviteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StoreInvites.
     */
    cursor?: StoreInviteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreInvites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreInvites.
     */
    skip?: number
    distinct?: StoreInviteScalarFieldEnum | StoreInviteScalarFieldEnum[]
  }

  /**
   * StoreInvite create
   */
  export type StoreInviteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * The data needed to create a StoreInvite.
     */
    data: XOR<StoreInviteCreateInput, StoreInviteUncheckedCreateInput>
  }

  /**
   * StoreInvite createMany
   */
  export type StoreInviteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StoreInvites.
     */
    data: StoreInviteCreateManyInput | StoreInviteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StoreInvite createManyAndReturn
   */
  export type StoreInviteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * The data used to create many StoreInvites.
     */
    data: StoreInviteCreateManyInput | StoreInviteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StoreInvite update
   */
  export type StoreInviteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * The data needed to update a StoreInvite.
     */
    data: XOR<StoreInviteUpdateInput, StoreInviteUncheckedUpdateInput>
    /**
     * Choose, which StoreInvite to update.
     */
    where: StoreInviteWhereUniqueInput
  }

  /**
   * StoreInvite updateMany
   */
  export type StoreInviteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StoreInvites.
     */
    data: XOR<StoreInviteUpdateManyMutationInput, StoreInviteUncheckedUpdateManyInput>
    /**
     * Filter which StoreInvites to update
     */
    where?: StoreInviteWhereInput
    /**
     * Limit how many StoreInvites to update.
     */
    limit?: number
  }

  /**
   * StoreInvite updateManyAndReturn
   */
  export type StoreInviteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * The data used to update StoreInvites.
     */
    data: XOR<StoreInviteUpdateManyMutationInput, StoreInviteUncheckedUpdateManyInput>
    /**
     * Filter which StoreInvites to update
     */
    where?: StoreInviteWhereInput
    /**
     * Limit how many StoreInvites to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * StoreInvite upsert
   */
  export type StoreInviteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * The filter to search for the StoreInvite to update in case it exists.
     */
    where: StoreInviteWhereUniqueInput
    /**
     * In case the StoreInvite found by the `where` argument doesn't exist, create a new StoreInvite with this data.
     */
    create: XOR<StoreInviteCreateInput, StoreInviteUncheckedCreateInput>
    /**
     * In case the StoreInvite was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StoreInviteUpdateInput, StoreInviteUncheckedUpdateInput>
  }

  /**
   * StoreInvite delete
   */
  export type StoreInviteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
    /**
     * Filter which StoreInvite to delete.
     */
    where: StoreInviteWhereUniqueInput
  }

  /**
   * StoreInvite deleteMany
   */
  export type StoreInviteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoreInvites to delete
     */
    where?: StoreInviteWhereInput
    /**
     * Limit how many StoreInvites to delete.
     */
    limit?: number
  }

  /**
   * StoreInvite without action
   */
  export type StoreInviteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreInvite
     */
    select?: StoreInviteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreInvite
     */
    omit?: StoreInviteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StoreInviteInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const OrganizationScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    created_at: 'created_at',
    updated_at: 'updated_at',
    subscription_id: 'subscription_id',
    subscription_status: 'subscription_status',
    subscription_ends_at: 'subscription_ends_at',
    owner_id: 'owner_id',
    uzum_fastpay_enabled: 'uzum_fastpay_enabled',
    uzum_fastpay_merchant_id: 'uzum_fastpay_merchant_id',
    uzum_fastpay_secret_key: 'uzum_fastpay_secret_key',
    uzum_fastpay_service_id: 'uzum_fastpay_service_id',
    uzum_fastpay_merchant_service_user_id: 'uzum_fastpay_merchant_service_user_id',
    ecommerce_enabled: 'ecommerce_enabled'
  };

  export type OrganizationScalarFieldEnum = (typeof OrganizationScalarFieldEnum)[keyof typeof OrganizationScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    password_hash: 'password_hash',
    created_at: 'created_at',
    updated_at: 'updated_at',
    push_token: 'push_token'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const UserAuthIdentityScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    provider: 'provider',
    provider_user_id: 'provider_user_id',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type UserAuthIdentityScalarFieldEnum = (typeof UserAuthIdentityScalarFieldEnum)[keyof typeof UserAuthIdentityScalarFieldEnum]


  export const MobilePushTokenScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    token: 'token',
    platform: 'platform',
    provider: 'provider',
    device_name: 'device_name',
    app_version: 'app_version',
    build_number: 'build_number',
    created_at: 'created_at',
    updated_at: 'updated_at',
    last_seen_at: 'last_seen_at'
  };

  export type MobilePushTokenScalarFieldEnum = (typeof MobilePushTokenScalarFieldEnum)[keyof typeof MobilePushTokenScalarFieldEnum]


  export const PasswordResetTokenScalarFieldEnum: {
    id: 'id',
    token_hash: 'token_hash',
    user_id: 'user_id',
    expires_at: 'expires_at',
    used_at: 'used_at',
    created_at: 'created_at'
  };

  export type PasswordResetTokenScalarFieldEnum = (typeof PasswordResetTokenScalarFieldEnum)[keyof typeof PasswordResetTokenScalarFieldEnum]


  export const UserOrganizationScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    organization_id: 'organization_id',
    store_id: 'store_id',
    role: 'role',
    permissions: 'permissions',
    approved: 'approved',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type UserOrganizationScalarFieldEnum = (typeof UserOrganizationScalarFieldEnum)[keyof typeof UserOrganizationScalarFieldEnum]


  export const StoreInviteScalarFieldEnum: {
    id: 'id',
    organization_id: 'organization_id',
    store_id: 'store_id',
    token_hash: 'token_hash',
    expires_at: 'expires_at',
    used_at: 'used_at',
    revoked_at: 'revoked_at',
    created_by: 'created_by',
    created_at: 'created_at'
  };

  export type StoreInviteScalarFieldEnum = (typeof StoreInviteScalarFieldEnum)[keyof typeof StoreInviteScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'SubscriptionStatus'
   */
  export type EnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus'>
    


  /**
   * Reference to a field of type 'SubscriptionStatus[]'
   */
  export type ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Permission[]'
   */
  export type ListEnumPermissionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Permission[]'>
    


  /**
   * Reference to a field of type 'Permission'
   */
  export type EnumPermissionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Permission'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type OrganizationWhereInput = {
    AND?: OrganizationWhereInput | OrganizationWhereInput[]
    OR?: OrganizationWhereInput[]
    NOT?: OrganizationWhereInput | OrganizationWhereInput[]
    id?: StringFilter<"Organization"> | string
    name?: StringFilter<"Organization"> | string
    slug?: StringFilter<"Organization"> | string
    created_at?: DateTimeFilter<"Organization"> | Date | string
    updated_at?: DateTimeFilter<"Organization"> | Date | string
    subscription_id?: StringNullableFilter<"Organization"> | string | null
    subscription_status?: EnumSubscriptionStatusNullableFilter<"Organization"> | $Enums.SubscriptionStatus | null
    subscription_ends_at?: DateTimeNullableFilter<"Organization"> | Date | string | null
    owner_id?: StringFilter<"Organization"> | string
    uzum_fastpay_enabled?: BoolFilter<"Organization"> | boolean
    uzum_fastpay_merchant_id?: StringNullableFilter<"Organization"> | string | null
    uzum_fastpay_secret_key?: StringNullableFilter<"Organization"> | string | null
    uzum_fastpay_service_id?: StringNullableFilter<"Organization"> | string | null
    uzum_fastpay_merchant_service_user_id?: StringNullableFilter<"Organization"> | string | null
    ecommerce_enabled?: BoolFilter<"Organization"> | boolean
    owner?: XOR<UserScalarRelationFilter, UserWhereInput>
    members?: UserOrganizationListRelationFilter
    invites?: StoreInviteListRelationFilter
  }

  export type OrganizationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    subscription_id?: SortOrderInput | SortOrder
    subscription_status?: SortOrderInput | SortOrder
    subscription_ends_at?: SortOrderInput | SortOrder
    owner_id?: SortOrder
    uzum_fastpay_enabled?: SortOrder
    uzum_fastpay_merchant_id?: SortOrderInput | SortOrder
    uzum_fastpay_secret_key?: SortOrderInput | SortOrder
    uzum_fastpay_service_id?: SortOrderInput | SortOrder
    uzum_fastpay_merchant_service_user_id?: SortOrderInput | SortOrder
    ecommerce_enabled?: SortOrder
    owner?: UserOrderByWithRelationInput
    members?: UserOrganizationOrderByRelationAggregateInput
    invites?: StoreInviteOrderByRelationAggregateInput
  }

  export type OrganizationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    owner_id?: string
    AND?: OrganizationWhereInput | OrganizationWhereInput[]
    OR?: OrganizationWhereInput[]
    NOT?: OrganizationWhereInput | OrganizationWhereInput[]
    name?: StringFilter<"Organization"> | string
    created_at?: DateTimeFilter<"Organization"> | Date | string
    updated_at?: DateTimeFilter<"Organization"> | Date | string
    subscription_id?: StringNullableFilter<"Organization"> | string | null
    subscription_status?: EnumSubscriptionStatusNullableFilter<"Organization"> | $Enums.SubscriptionStatus | null
    subscription_ends_at?: DateTimeNullableFilter<"Organization"> | Date | string | null
    uzum_fastpay_enabled?: BoolFilter<"Organization"> | boolean
    uzum_fastpay_merchant_id?: StringNullableFilter<"Organization"> | string | null
    uzum_fastpay_secret_key?: StringNullableFilter<"Organization"> | string | null
    uzum_fastpay_service_id?: StringNullableFilter<"Organization"> | string | null
    uzum_fastpay_merchant_service_user_id?: StringNullableFilter<"Organization"> | string | null
    ecommerce_enabled?: BoolFilter<"Organization"> | boolean
    owner?: XOR<UserScalarRelationFilter, UserWhereInput>
    members?: UserOrganizationListRelationFilter
    invites?: StoreInviteListRelationFilter
  }, "id" | "slug" | "owner_id">

  export type OrganizationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    subscription_id?: SortOrderInput | SortOrder
    subscription_status?: SortOrderInput | SortOrder
    subscription_ends_at?: SortOrderInput | SortOrder
    owner_id?: SortOrder
    uzum_fastpay_enabled?: SortOrder
    uzum_fastpay_merchant_id?: SortOrderInput | SortOrder
    uzum_fastpay_secret_key?: SortOrderInput | SortOrder
    uzum_fastpay_service_id?: SortOrderInput | SortOrder
    uzum_fastpay_merchant_service_user_id?: SortOrderInput | SortOrder
    ecommerce_enabled?: SortOrder
    _count?: OrganizationCountOrderByAggregateInput
    _max?: OrganizationMaxOrderByAggregateInput
    _min?: OrganizationMinOrderByAggregateInput
  }

  export type OrganizationScalarWhereWithAggregatesInput = {
    AND?: OrganizationScalarWhereWithAggregatesInput | OrganizationScalarWhereWithAggregatesInput[]
    OR?: OrganizationScalarWhereWithAggregatesInput[]
    NOT?: OrganizationScalarWhereWithAggregatesInput | OrganizationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Organization"> | string
    name?: StringWithAggregatesFilter<"Organization"> | string
    slug?: StringWithAggregatesFilter<"Organization"> | string
    created_at?: DateTimeWithAggregatesFilter<"Organization"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Organization"> | Date | string
    subscription_id?: StringNullableWithAggregatesFilter<"Organization"> | string | null
    subscription_status?: EnumSubscriptionStatusNullableWithAggregatesFilter<"Organization"> | $Enums.SubscriptionStatus | null
    subscription_ends_at?: DateTimeNullableWithAggregatesFilter<"Organization"> | Date | string | null
    owner_id?: StringWithAggregatesFilter<"Organization"> | string
    uzum_fastpay_enabled?: BoolWithAggregatesFilter<"Organization"> | boolean
    uzum_fastpay_merchant_id?: StringNullableWithAggregatesFilter<"Organization"> | string | null
    uzum_fastpay_secret_key?: StringNullableWithAggregatesFilter<"Organization"> | string | null
    uzum_fastpay_service_id?: StringNullableWithAggregatesFilter<"Organization"> | string | null
    uzum_fastpay_merchant_service_user_id?: StringNullableWithAggregatesFilter<"Organization"> | string | null
    ecommerce_enabled?: BoolWithAggregatesFilter<"Organization"> | boolean
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    email?: StringFilter<"User"> | string
    password_hash?: StringNullableFilter<"User"> | string | null
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
    push_token?: StringNullableFilter<"User"> | string | null
    owned_organization?: XOR<OrganizationNullableScalarRelationFilter, OrganizationWhereInput> | null
    mobile_push_tokens?: MobilePushTokenListRelationFilter
    password_reset_tokens?: PasswordResetTokenListRelationFilter
    auth_identities?: UserAuthIdentityListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrder
    password_hash?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    push_token?: SortOrderInput | SortOrder
    owned_organization?: OrganizationOrderByWithRelationInput
    mobile_push_tokens?: MobilePushTokenOrderByRelationAggregateInput
    password_reset_tokens?: PasswordResetTokenOrderByRelationAggregateInput
    auth_identities?: UserAuthIdentityOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    password_hash?: StringNullableFilter<"User"> | string | null
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
    push_token?: StringNullableFilter<"User"> | string | null
    owned_organization?: XOR<OrganizationNullableScalarRelationFilter, OrganizationWhereInput> | null
    mobile_push_tokens?: MobilePushTokenListRelationFilter
    password_reset_tokens?: PasswordResetTokenListRelationFilter
    auth_identities?: UserAuthIdentityListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrder
    password_hash?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    push_token?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    email?: StringWithAggregatesFilter<"User"> | string
    password_hash?: StringNullableWithAggregatesFilter<"User"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
    push_token?: StringNullableWithAggregatesFilter<"User"> | string | null
  }

  export type UserAuthIdentityWhereInput = {
    AND?: UserAuthIdentityWhereInput | UserAuthIdentityWhereInput[]
    OR?: UserAuthIdentityWhereInput[]
    NOT?: UserAuthIdentityWhereInput | UserAuthIdentityWhereInput[]
    id?: StringFilter<"UserAuthIdentity"> | string
    user_id?: StringFilter<"UserAuthIdentity"> | string
    provider?: StringFilter<"UserAuthIdentity"> | string
    provider_user_id?: StringFilter<"UserAuthIdentity"> | string
    created_at?: DateTimeFilter<"UserAuthIdentity"> | Date | string
    updated_at?: DateTimeFilter<"UserAuthIdentity"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type UserAuthIdentityOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_user_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type UserAuthIdentityWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    provider_provider_user_id?: UserAuthIdentityProviderProvider_user_idCompoundUniqueInput
    AND?: UserAuthIdentityWhereInput | UserAuthIdentityWhereInput[]
    OR?: UserAuthIdentityWhereInput[]
    NOT?: UserAuthIdentityWhereInput | UserAuthIdentityWhereInput[]
    user_id?: StringFilter<"UserAuthIdentity"> | string
    provider?: StringFilter<"UserAuthIdentity"> | string
    provider_user_id?: StringFilter<"UserAuthIdentity"> | string
    created_at?: DateTimeFilter<"UserAuthIdentity"> | Date | string
    updated_at?: DateTimeFilter<"UserAuthIdentity"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "provider_provider_user_id">

  export type UserAuthIdentityOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_user_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: UserAuthIdentityCountOrderByAggregateInput
    _max?: UserAuthIdentityMaxOrderByAggregateInput
    _min?: UserAuthIdentityMinOrderByAggregateInput
  }

  export type UserAuthIdentityScalarWhereWithAggregatesInput = {
    AND?: UserAuthIdentityScalarWhereWithAggregatesInput | UserAuthIdentityScalarWhereWithAggregatesInput[]
    OR?: UserAuthIdentityScalarWhereWithAggregatesInput[]
    NOT?: UserAuthIdentityScalarWhereWithAggregatesInput | UserAuthIdentityScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserAuthIdentity"> | string
    user_id?: StringWithAggregatesFilter<"UserAuthIdentity"> | string
    provider?: StringWithAggregatesFilter<"UserAuthIdentity"> | string
    provider_user_id?: StringWithAggregatesFilter<"UserAuthIdentity"> | string
    created_at?: DateTimeWithAggregatesFilter<"UserAuthIdentity"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"UserAuthIdentity"> | Date | string
  }

  export type MobilePushTokenWhereInput = {
    AND?: MobilePushTokenWhereInput | MobilePushTokenWhereInput[]
    OR?: MobilePushTokenWhereInput[]
    NOT?: MobilePushTokenWhereInput | MobilePushTokenWhereInput[]
    id?: StringFilter<"MobilePushToken"> | string
    user_id?: StringFilter<"MobilePushToken"> | string
    token?: StringFilter<"MobilePushToken"> | string
    platform?: StringFilter<"MobilePushToken"> | string
    provider?: StringFilter<"MobilePushToken"> | string
    device_name?: StringNullableFilter<"MobilePushToken"> | string | null
    app_version?: StringNullableFilter<"MobilePushToken"> | string | null
    build_number?: StringNullableFilter<"MobilePushToken"> | string | null
    created_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    updated_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    last_seen_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type MobilePushTokenOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    token?: SortOrder
    platform?: SortOrder
    provider?: SortOrder
    device_name?: SortOrderInput | SortOrder
    app_version?: SortOrderInput | SortOrder
    build_number?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_seen_at?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type MobilePushTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: MobilePushTokenWhereInput | MobilePushTokenWhereInput[]
    OR?: MobilePushTokenWhereInput[]
    NOT?: MobilePushTokenWhereInput | MobilePushTokenWhereInput[]
    user_id?: StringFilter<"MobilePushToken"> | string
    platform?: StringFilter<"MobilePushToken"> | string
    provider?: StringFilter<"MobilePushToken"> | string
    device_name?: StringNullableFilter<"MobilePushToken"> | string | null
    app_version?: StringNullableFilter<"MobilePushToken"> | string | null
    build_number?: StringNullableFilter<"MobilePushToken"> | string | null
    created_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    updated_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    last_seen_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type MobilePushTokenOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    token?: SortOrder
    platform?: SortOrder
    provider?: SortOrder
    device_name?: SortOrderInput | SortOrder
    app_version?: SortOrderInput | SortOrder
    build_number?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_seen_at?: SortOrder
    _count?: MobilePushTokenCountOrderByAggregateInput
    _max?: MobilePushTokenMaxOrderByAggregateInput
    _min?: MobilePushTokenMinOrderByAggregateInput
  }

  export type MobilePushTokenScalarWhereWithAggregatesInput = {
    AND?: MobilePushTokenScalarWhereWithAggregatesInput | MobilePushTokenScalarWhereWithAggregatesInput[]
    OR?: MobilePushTokenScalarWhereWithAggregatesInput[]
    NOT?: MobilePushTokenScalarWhereWithAggregatesInput | MobilePushTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MobilePushToken"> | string
    user_id?: StringWithAggregatesFilter<"MobilePushToken"> | string
    token?: StringWithAggregatesFilter<"MobilePushToken"> | string
    platform?: StringWithAggregatesFilter<"MobilePushToken"> | string
    provider?: StringWithAggregatesFilter<"MobilePushToken"> | string
    device_name?: StringNullableWithAggregatesFilter<"MobilePushToken"> | string | null
    app_version?: StringNullableWithAggregatesFilter<"MobilePushToken"> | string | null
    build_number?: StringNullableWithAggregatesFilter<"MobilePushToken"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"MobilePushToken"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"MobilePushToken"> | Date | string
    last_seen_at?: DateTimeWithAggregatesFilter<"MobilePushToken"> | Date | string
  }

  export type PasswordResetTokenWhereInput = {
    AND?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    OR?: PasswordResetTokenWhereInput[]
    NOT?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    id?: StringFilter<"PasswordResetToken"> | string
    token_hash?: StringFilter<"PasswordResetToken"> | string
    user_id?: StringFilter<"PasswordResetToken"> | string
    expires_at?: DateTimeFilter<"PasswordResetToken"> | Date | string
    used_at?: DateTimeNullableFilter<"PasswordResetToken"> | Date | string | null
    created_at?: DateTimeFilter<"PasswordResetToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PasswordResetTokenOrderByWithRelationInput = {
    id?: SortOrder
    token_hash?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrderInput | SortOrder
    created_at?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type PasswordResetTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token_hash?: string
    AND?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    OR?: PasswordResetTokenWhereInput[]
    NOT?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    user_id?: StringFilter<"PasswordResetToken"> | string
    expires_at?: DateTimeFilter<"PasswordResetToken"> | Date | string
    used_at?: DateTimeNullableFilter<"PasswordResetToken"> | Date | string | null
    created_at?: DateTimeFilter<"PasswordResetToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token_hash">

  export type PasswordResetTokenOrderByWithAggregationInput = {
    id?: SortOrder
    token_hash?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: PasswordResetTokenCountOrderByAggregateInput
    _max?: PasswordResetTokenMaxOrderByAggregateInput
    _min?: PasswordResetTokenMinOrderByAggregateInput
  }

  export type PasswordResetTokenScalarWhereWithAggregatesInput = {
    AND?: PasswordResetTokenScalarWhereWithAggregatesInput | PasswordResetTokenScalarWhereWithAggregatesInput[]
    OR?: PasswordResetTokenScalarWhereWithAggregatesInput[]
    NOT?: PasswordResetTokenScalarWhereWithAggregatesInput | PasswordResetTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PasswordResetToken"> | string
    token_hash?: StringWithAggregatesFilter<"PasswordResetToken"> | string
    user_id?: StringWithAggregatesFilter<"PasswordResetToken"> | string
    expires_at?: DateTimeWithAggregatesFilter<"PasswordResetToken"> | Date | string
    used_at?: DateTimeNullableWithAggregatesFilter<"PasswordResetToken"> | Date | string | null
    created_at?: DateTimeWithAggregatesFilter<"PasswordResetToken"> | Date | string
  }

  export type UserOrganizationWhereInput = {
    AND?: UserOrganizationWhereInput | UserOrganizationWhereInput[]
    OR?: UserOrganizationWhereInput[]
    NOT?: UserOrganizationWhereInput | UserOrganizationWhereInput[]
    id?: StringFilter<"UserOrganization"> | string
    user_id?: StringFilter<"UserOrganization"> | string
    organization_id?: StringFilter<"UserOrganization"> | string
    store_id?: StringFilter<"UserOrganization"> | string
    role?: EnumRoleFilter<"UserOrganization"> | $Enums.Role
    permissions?: EnumPermissionNullableListFilter<"UserOrganization">
    approved?: BoolFilter<"UserOrganization"> | boolean
    created_at?: DateTimeFilter<"UserOrganization"> | Date | string
    updated_at?: DateTimeFilter<"UserOrganization"> | Date | string
    organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
  }

  export type UserOrganizationOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    role?: SortOrder
    permissions?: SortOrder
    approved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    organization?: OrganizationOrderByWithRelationInput
  }

  export type UserOrganizationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    user_id?: string
    user_id_organization_id_store_id?: UserOrganizationUser_idOrganization_idStore_idCompoundUniqueInput
    AND?: UserOrganizationWhereInput | UserOrganizationWhereInput[]
    OR?: UserOrganizationWhereInput[]
    NOT?: UserOrganizationWhereInput | UserOrganizationWhereInput[]
    organization_id?: StringFilter<"UserOrganization"> | string
    store_id?: StringFilter<"UserOrganization"> | string
    role?: EnumRoleFilter<"UserOrganization"> | $Enums.Role
    permissions?: EnumPermissionNullableListFilter<"UserOrganization">
    approved?: BoolFilter<"UserOrganization"> | boolean
    created_at?: DateTimeFilter<"UserOrganization"> | Date | string
    updated_at?: DateTimeFilter<"UserOrganization"> | Date | string
    organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
  }, "id" | "user_id" | "user_id_organization_id_store_id">

  export type UserOrganizationOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    role?: SortOrder
    permissions?: SortOrder
    approved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: UserOrganizationCountOrderByAggregateInput
    _max?: UserOrganizationMaxOrderByAggregateInput
    _min?: UserOrganizationMinOrderByAggregateInput
  }

  export type UserOrganizationScalarWhereWithAggregatesInput = {
    AND?: UserOrganizationScalarWhereWithAggregatesInput | UserOrganizationScalarWhereWithAggregatesInput[]
    OR?: UserOrganizationScalarWhereWithAggregatesInput[]
    NOT?: UserOrganizationScalarWhereWithAggregatesInput | UserOrganizationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserOrganization"> | string
    user_id?: StringWithAggregatesFilter<"UserOrganization"> | string
    organization_id?: StringWithAggregatesFilter<"UserOrganization"> | string
    store_id?: StringWithAggregatesFilter<"UserOrganization"> | string
    role?: EnumRoleWithAggregatesFilter<"UserOrganization"> | $Enums.Role
    permissions?: EnumPermissionNullableListFilter<"UserOrganization">
    approved?: BoolWithAggregatesFilter<"UserOrganization"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"UserOrganization"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"UserOrganization"> | Date | string
  }

  export type StoreInviteWhereInput = {
    AND?: StoreInviteWhereInput | StoreInviteWhereInput[]
    OR?: StoreInviteWhereInput[]
    NOT?: StoreInviteWhereInput | StoreInviteWhereInput[]
    id?: StringFilter<"StoreInvite"> | string
    organization_id?: StringFilter<"StoreInvite"> | string
    store_id?: StringFilter<"StoreInvite"> | string
    token_hash?: StringFilter<"StoreInvite"> | string
    expires_at?: DateTimeFilter<"StoreInvite"> | Date | string
    used_at?: DateTimeNullableFilter<"StoreInvite"> | Date | string | null
    revoked_at?: DateTimeNullableFilter<"StoreInvite"> | Date | string | null
    created_by?: StringFilter<"StoreInvite"> | string
    created_at?: DateTimeFilter<"StoreInvite"> | Date | string
    organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
  }

  export type StoreInviteOrderByWithRelationInput = {
    id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    token_hash?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrderInput | SortOrder
    revoked_at?: SortOrderInput | SortOrder
    created_by?: SortOrder
    created_at?: SortOrder
    organization?: OrganizationOrderByWithRelationInput
  }

  export type StoreInviteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token_hash?: string
    AND?: StoreInviteWhereInput | StoreInviteWhereInput[]
    OR?: StoreInviteWhereInput[]
    NOT?: StoreInviteWhereInput | StoreInviteWhereInput[]
    organization_id?: StringFilter<"StoreInvite"> | string
    store_id?: StringFilter<"StoreInvite"> | string
    expires_at?: DateTimeFilter<"StoreInvite"> | Date | string
    used_at?: DateTimeNullableFilter<"StoreInvite"> | Date | string | null
    revoked_at?: DateTimeNullableFilter<"StoreInvite"> | Date | string | null
    created_by?: StringFilter<"StoreInvite"> | string
    created_at?: DateTimeFilter<"StoreInvite"> | Date | string
    organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
  }, "id" | "token_hash">

  export type StoreInviteOrderByWithAggregationInput = {
    id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    token_hash?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrderInput | SortOrder
    revoked_at?: SortOrderInput | SortOrder
    created_by?: SortOrder
    created_at?: SortOrder
    _count?: StoreInviteCountOrderByAggregateInput
    _max?: StoreInviteMaxOrderByAggregateInput
    _min?: StoreInviteMinOrderByAggregateInput
  }

  export type StoreInviteScalarWhereWithAggregatesInput = {
    AND?: StoreInviteScalarWhereWithAggregatesInput | StoreInviteScalarWhereWithAggregatesInput[]
    OR?: StoreInviteScalarWhereWithAggregatesInput[]
    NOT?: StoreInviteScalarWhereWithAggregatesInput | StoreInviteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StoreInvite"> | string
    organization_id?: StringWithAggregatesFilter<"StoreInvite"> | string
    store_id?: StringWithAggregatesFilter<"StoreInvite"> | string
    token_hash?: StringWithAggregatesFilter<"StoreInvite"> | string
    expires_at?: DateTimeWithAggregatesFilter<"StoreInvite"> | Date | string
    used_at?: DateTimeNullableWithAggregatesFilter<"StoreInvite"> | Date | string | null
    revoked_at?: DateTimeNullableWithAggregatesFilter<"StoreInvite"> | Date | string | null
    created_by?: StringWithAggregatesFilter<"StoreInvite"> | string
    created_at?: DateTimeWithAggregatesFilter<"StoreInvite"> | Date | string
  }

  export type OrganizationCreateInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    owner: UserCreateNestedOneWithoutOwned_organizationInput
    members?: UserOrganizationCreateNestedManyWithoutOrganizationInput
    invites?: StoreInviteCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    owner_id: string
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    members?: UserOrganizationUncheckedCreateNestedManyWithoutOrganizationInput
    invites?: StoreInviteUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    owner?: UserUpdateOneRequiredWithoutOwned_organizationNestedInput
    members?: UserOrganizationUpdateManyWithoutOrganizationNestedInput
    invites?: StoreInviteUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    members?: UserOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput
    invites?: StoreInviteUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationCreateManyInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    owner_id: string
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
  }

  export type OrganizationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
  }

  export type OrganizationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
  }

  export type UserCreateInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationCreateNestedOneWithoutOwnerInput
    mobile_push_tokens?: MobilePushTokenCreateNestedManyWithoutUserInput
    password_reset_tokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationUncheckedCreateNestedOneWithoutOwnerInput
    mobile_push_tokens?: MobilePushTokenUncheckedCreateNestedManyWithoutUserInput
    password_reset_tokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUpdateOneWithoutOwnerNestedInput
    mobile_push_tokens?: MobilePushTokenUpdateManyWithoutUserNestedInput
    password_reset_tokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUncheckedUpdateOneWithoutOwnerNestedInput
    mobile_push_tokens?: MobilePushTokenUncheckedUpdateManyWithoutUserNestedInput
    password_reset_tokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserAuthIdentityCreateInput = {
    id?: string
    provider: string
    provider_user_id: string
    created_at?: Date | string
    updated_at?: Date | string
    user: UserCreateNestedOneWithoutAuth_identitiesInput
  }

  export type UserAuthIdentityUncheckedCreateInput = {
    id?: string
    user_id: string
    provider: string
    provider_user_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserAuthIdentityUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutAuth_identitiesNestedInput
  }

  export type UserAuthIdentityUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserAuthIdentityCreateManyInput = {
    id?: string
    user_id: string
    provider: string
    provider_user_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserAuthIdentityUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserAuthIdentityUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MobilePushTokenCreateInput = {
    id?: string
    token: string
    platform: string
    provider: string
    device_name?: string | null
    app_version?: string | null
    build_number?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    last_seen_at?: Date | string
    user: UserCreateNestedOneWithoutMobile_push_tokensInput
  }

  export type MobilePushTokenUncheckedCreateInput = {
    id?: string
    user_id: string
    token: string
    platform: string
    provider: string
    device_name?: string | null
    app_version?: string | null
    build_number?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    last_seen_at?: Date | string
  }

  export type MobilePushTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutMobile_push_tokensNestedInput
  }

  export type MobilePushTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MobilePushTokenCreateManyInput = {
    id?: string
    user_id: string
    token: string
    platform: string
    provider: string
    device_name?: string | null
    app_version?: string | null
    build_number?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    last_seen_at?: Date | string
  }

  export type MobilePushTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MobilePushTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenCreateInput = {
    id?: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    created_at?: Date | string
    user: UserCreateNestedOneWithoutPassword_reset_tokensInput
  }

  export type PasswordResetTokenUncheckedCreateInput = {
    id?: string
    token_hash: string
    user_id: string
    expires_at: Date | string
    used_at?: Date | string | null
    created_at?: Date | string
  }

  export type PasswordResetTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutPassword_reset_tokensNestedInput
  }

  export type PasswordResetTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenCreateManyInput = {
    id?: string
    token_hash: string
    user_id: string
    expires_at: Date | string
    used_at?: Date | string | null
    created_at?: Date | string
  }

  export type PasswordResetTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserOrganizationCreateInput = {
    id?: string
    user_id: string
    store_id: string
    role?: $Enums.Role
    permissions?: UserOrganizationCreatepermissionsInput | $Enums.Permission[]
    approved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    organization: OrganizationCreateNestedOneWithoutMembersInput
  }

  export type UserOrganizationUncheckedCreateInput = {
    id?: string
    user_id: string
    organization_id: string
    store_id: string
    role?: $Enums.Role
    permissions?: UserOrganizationCreatepermissionsInput | $Enums.Permission[]
    approved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserOrganizationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneRequiredWithoutMembersNestedInput
  }

  export type UserOrganizationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    organization_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserOrganizationCreateManyInput = {
    id?: string
    user_id: string
    organization_id: string
    store_id: string
    role?: $Enums.Role
    permissions?: UserOrganizationCreatepermissionsInput | $Enums.Permission[]
    approved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserOrganizationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserOrganizationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    organization_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoreInviteCreateInput = {
    id?: string
    store_id: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    revoked_at?: Date | string | null
    created_by: string
    created_at?: Date | string
    organization: OrganizationCreateNestedOneWithoutInvitesInput
  }

  export type StoreInviteUncheckedCreateInput = {
    id?: string
    organization_id: string
    store_id: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    revoked_at?: Date | string | null
    created_by: string
    created_at?: Date | string
  }

  export type StoreInviteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneRequiredWithoutInvitesNestedInput
  }

  export type StoreInviteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    organization_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoreInviteCreateManyInput = {
    id?: string
    organization_id: string
    store_id: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    revoked_at?: Date | string | null
    created_by: string
    created_at?: Date | string
  }

  export type StoreInviteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoreInviteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    organization_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumSubscriptionStatusNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumSubscriptionStatusNullableFilter<$PrismaModel> | $Enums.SubscriptionStatus | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type UserOrganizationListRelationFilter = {
    every?: UserOrganizationWhereInput
    some?: UserOrganizationWhereInput
    none?: UserOrganizationWhereInput
  }

  export type StoreInviteListRelationFilter = {
    every?: StoreInviteWhereInput
    some?: StoreInviteWhereInput
    none?: StoreInviteWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserOrganizationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StoreInviteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OrganizationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    subscription_id?: SortOrder
    subscription_status?: SortOrder
    subscription_ends_at?: SortOrder
    owner_id?: SortOrder
    uzum_fastpay_enabled?: SortOrder
    uzum_fastpay_merchant_id?: SortOrder
    uzum_fastpay_secret_key?: SortOrder
    uzum_fastpay_service_id?: SortOrder
    uzum_fastpay_merchant_service_user_id?: SortOrder
    ecommerce_enabled?: SortOrder
  }

  export type OrganizationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    subscription_id?: SortOrder
    subscription_status?: SortOrder
    subscription_ends_at?: SortOrder
    owner_id?: SortOrder
    uzum_fastpay_enabled?: SortOrder
    uzum_fastpay_merchant_id?: SortOrder
    uzum_fastpay_secret_key?: SortOrder
    uzum_fastpay_service_id?: SortOrder
    uzum_fastpay_merchant_service_user_id?: SortOrder
    ecommerce_enabled?: SortOrder
  }

  export type OrganizationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    subscription_id?: SortOrder
    subscription_status?: SortOrder
    subscription_ends_at?: SortOrder
    owner_id?: SortOrder
    uzum_fastpay_enabled?: SortOrder
    uzum_fastpay_merchant_id?: SortOrder
    uzum_fastpay_secret_key?: SortOrder
    uzum_fastpay_service_id?: SortOrder
    uzum_fastpay_merchant_service_user_id?: SortOrder
    ecommerce_enabled?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumSubscriptionStatusNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumSubscriptionStatusNullableWithAggregatesFilter<$PrismaModel> | $Enums.SubscriptionStatus | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumSubscriptionStatusNullableFilter<$PrismaModel>
    _max?: NestedEnumSubscriptionStatusNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type OrganizationNullableScalarRelationFilter = {
    is?: OrganizationWhereInput | null
    isNot?: OrganizationWhereInput | null
  }

  export type MobilePushTokenListRelationFilter = {
    every?: MobilePushTokenWhereInput
    some?: MobilePushTokenWhereInput
    none?: MobilePushTokenWhereInput
  }

  export type PasswordResetTokenListRelationFilter = {
    every?: PasswordResetTokenWhereInput
    some?: PasswordResetTokenWhereInput
    none?: PasswordResetTokenWhereInput
  }

  export type UserAuthIdentityListRelationFilter = {
    every?: UserAuthIdentityWhereInput
    some?: UserAuthIdentityWhereInput
    none?: UserAuthIdentityWhereInput
  }

  export type MobilePushTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PasswordResetTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserAuthIdentityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    push_token?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    push_token?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    push_token?: SortOrder
  }

  export type UserAuthIdentityProviderProvider_user_idCompoundUniqueInput = {
    provider: string
    provider_user_id: string
  }

  export type UserAuthIdentityCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_user_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UserAuthIdentityMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_user_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UserAuthIdentityMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_user_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type MobilePushTokenCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    token?: SortOrder
    platform?: SortOrder
    provider?: SortOrder
    device_name?: SortOrder
    app_version?: SortOrder
    build_number?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_seen_at?: SortOrder
  }

  export type MobilePushTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    token?: SortOrder
    platform?: SortOrder
    provider?: SortOrder
    device_name?: SortOrder
    app_version?: SortOrder
    build_number?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_seen_at?: SortOrder
  }

  export type MobilePushTokenMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    token?: SortOrder
    platform?: SortOrder
    provider?: SortOrder
    device_name?: SortOrder
    app_version?: SortOrder
    build_number?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_seen_at?: SortOrder
  }

  export type PasswordResetTokenCountOrderByAggregateInput = {
    id?: SortOrder
    token_hash?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrder
    created_at?: SortOrder
  }

  export type PasswordResetTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    token_hash?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrder
    created_at?: SortOrder
  }

  export type PasswordResetTokenMinOrderByAggregateInput = {
    id?: SortOrder
    token_hash?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrder
    created_at?: SortOrder
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type EnumPermissionNullableListFilter<$PrismaModel = never> = {
    equals?: $Enums.Permission[] | ListEnumPermissionFieldRefInput<$PrismaModel> | null
    has?: $Enums.Permission | EnumPermissionFieldRefInput<$PrismaModel> | null
    hasEvery?: $Enums.Permission[] | ListEnumPermissionFieldRefInput<$PrismaModel>
    hasSome?: $Enums.Permission[] | ListEnumPermissionFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type OrganizationScalarRelationFilter = {
    is?: OrganizationWhereInput
    isNot?: OrganizationWhereInput
  }

  export type UserOrganizationUser_idOrganization_idStore_idCompoundUniqueInput = {
    user_id: string
    organization_id: string
    store_id: string
  }

  export type UserOrganizationCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    role?: SortOrder
    permissions?: SortOrder
    approved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UserOrganizationMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    role?: SortOrder
    approved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UserOrganizationMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    role?: SortOrder
    approved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type StoreInviteCountOrderByAggregateInput = {
    id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    token_hash?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrder
    revoked_at?: SortOrder
    created_by?: SortOrder
    created_at?: SortOrder
  }

  export type StoreInviteMaxOrderByAggregateInput = {
    id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    token_hash?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrder
    revoked_at?: SortOrder
    created_by?: SortOrder
    created_at?: SortOrder
  }

  export type StoreInviteMinOrderByAggregateInput = {
    id?: SortOrder
    organization_id?: SortOrder
    store_id?: SortOrder
    token_hash?: SortOrder
    expires_at?: SortOrder
    used_at?: SortOrder
    revoked_at?: SortOrder
    created_by?: SortOrder
    created_at?: SortOrder
  }

  export type UserCreateNestedOneWithoutOwned_organizationInput = {
    create?: XOR<UserCreateWithoutOwned_organizationInput, UserUncheckedCreateWithoutOwned_organizationInput>
    connectOrCreate?: UserCreateOrConnectWithoutOwned_organizationInput
    connect?: UserWhereUniqueInput
  }

  export type UserOrganizationCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<UserOrganizationCreateWithoutOrganizationInput, UserOrganizationUncheckedCreateWithoutOrganizationInput> | UserOrganizationCreateWithoutOrganizationInput[] | UserOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: UserOrganizationCreateOrConnectWithoutOrganizationInput | UserOrganizationCreateOrConnectWithoutOrganizationInput[]
    createMany?: UserOrganizationCreateManyOrganizationInputEnvelope
    connect?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
  }

  export type StoreInviteCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<StoreInviteCreateWithoutOrganizationInput, StoreInviteUncheckedCreateWithoutOrganizationInput> | StoreInviteCreateWithoutOrganizationInput[] | StoreInviteUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: StoreInviteCreateOrConnectWithoutOrganizationInput | StoreInviteCreateOrConnectWithoutOrganizationInput[]
    createMany?: StoreInviteCreateManyOrganizationInputEnvelope
    connect?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
  }

  export type UserOrganizationUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<UserOrganizationCreateWithoutOrganizationInput, UserOrganizationUncheckedCreateWithoutOrganizationInput> | UserOrganizationCreateWithoutOrganizationInput[] | UserOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: UserOrganizationCreateOrConnectWithoutOrganizationInput | UserOrganizationCreateOrConnectWithoutOrganizationInput[]
    createMany?: UserOrganizationCreateManyOrganizationInputEnvelope
    connect?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
  }

  export type StoreInviteUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<StoreInviteCreateWithoutOrganizationInput, StoreInviteUncheckedCreateWithoutOrganizationInput> | StoreInviteCreateWithoutOrganizationInput[] | StoreInviteUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: StoreInviteCreateOrConnectWithoutOrganizationInput | StoreInviteCreateOrConnectWithoutOrganizationInput[]
    createMany?: StoreInviteCreateManyOrganizationInputEnvelope
    connect?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableEnumSubscriptionStatusFieldUpdateOperationsInput = {
    set?: $Enums.SubscriptionStatus | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type UserUpdateOneRequiredWithoutOwned_organizationNestedInput = {
    create?: XOR<UserCreateWithoutOwned_organizationInput, UserUncheckedCreateWithoutOwned_organizationInput>
    connectOrCreate?: UserCreateOrConnectWithoutOwned_organizationInput
    upsert?: UserUpsertWithoutOwned_organizationInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutOwned_organizationInput, UserUpdateWithoutOwned_organizationInput>, UserUncheckedUpdateWithoutOwned_organizationInput>
  }

  export type UserOrganizationUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<UserOrganizationCreateWithoutOrganizationInput, UserOrganizationUncheckedCreateWithoutOrganizationInput> | UserOrganizationCreateWithoutOrganizationInput[] | UserOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: UserOrganizationCreateOrConnectWithoutOrganizationInput | UserOrganizationCreateOrConnectWithoutOrganizationInput[]
    upsert?: UserOrganizationUpsertWithWhereUniqueWithoutOrganizationInput | UserOrganizationUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: UserOrganizationCreateManyOrganizationInputEnvelope
    set?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    disconnect?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    delete?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    connect?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    update?: UserOrganizationUpdateWithWhereUniqueWithoutOrganizationInput | UserOrganizationUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: UserOrganizationUpdateManyWithWhereWithoutOrganizationInput | UserOrganizationUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: UserOrganizationScalarWhereInput | UserOrganizationScalarWhereInput[]
  }

  export type StoreInviteUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<StoreInviteCreateWithoutOrganizationInput, StoreInviteUncheckedCreateWithoutOrganizationInput> | StoreInviteCreateWithoutOrganizationInput[] | StoreInviteUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: StoreInviteCreateOrConnectWithoutOrganizationInput | StoreInviteCreateOrConnectWithoutOrganizationInput[]
    upsert?: StoreInviteUpsertWithWhereUniqueWithoutOrganizationInput | StoreInviteUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: StoreInviteCreateManyOrganizationInputEnvelope
    set?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    disconnect?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    delete?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    connect?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    update?: StoreInviteUpdateWithWhereUniqueWithoutOrganizationInput | StoreInviteUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: StoreInviteUpdateManyWithWhereWithoutOrganizationInput | StoreInviteUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: StoreInviteScalarWhereInput | StoreInviteScalarWhereInput[]
  }

  export type UserOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<UserOrganizationCreateWithoutOrganizationInput, UserOrganizationUncheckedCreateWithoutOrganizationInput> | UserOrganizationCreateWithoutOrganizationInput[] | UserOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: UserOrganizationCreateOrConnectWithoutOrganizationInput | UserOrganizationCreateOrConnectWithoutOrganizationInput[]
    upsert?: UserOrganizationUpsertWithWhereUniqueWithoutOrganizationInput | UserOrganizationUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: UserOrganizationCreateManyOrganizationInputEnvelope
    set?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    disconnect?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    delete?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    connect?: UserOrganizationWhereUniqueInput | UserOrganizationWhereUniqueInput[]
    update?: UserOrganizationUpdateWithWhereUniqueWithoutOrganizationInput | UserOrganizationUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: UserOrganizationUpdateManyWithWhereWithoutOrganizationInput | UserOrganizationUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: UserOrganizationScalarWhereInput | UserOrganizationScalarWhereInput[]
  }

  export type StoreInviteUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<StoreInviteCreateWithoutOrganizationInput, StoreInviteUncheckedCreateWithoutOrganizationInput> | StoreInviteCreateWithoutOrganizationInput[] | StoreInviteUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: StoreInviteCreateOrConnectWithoutOrganizationInput | StoreInviteCreateOrConnectWithoutOrganizationInput[]
    upsert?: StoreInviteUpsertWithWhereUniqueWithoutOrganizationInput | StoreInviteUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: StoreInviteCreateManyOrganizationInputEnvelope
    set?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    disconnect?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    delete?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    connect?: StoreInviteWhereUniqueInput | StoreInviteWhereUniqueInput[]
    update?: StoreInviteUpdateWithWhereUniqueWithoutOrganizationInput | StoreInviteUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: StoreInviteUpdateManyWithWhereWithoutOrganizationInput | StoreInviteUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: StoreInviteScalarWhereInput | StoreInviteScalarWhereInput[]
  }

  export type OrganizationCreateNestedOneWithoutOwnerInput = {
    create?: XOR<OrganizationCreateWithoutOwnerInput, OrganizationUncheckedCreateWithoutOwnerInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutOwnerInput
    connect?: OrganizationWhereUniqueInput
  }

  export type MobilePushTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<MobilePushTokenCreateWithoutUserInput, MobilePushTokenUncheckedCreateWithoutUserInput> | MobilePushTokenCreateWithoutUserInput[] | MobilePushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MobilePushTokenCreateOrConnectWithoutUserInput | MobilePushTokenCreateOrConnectWithoutUserInput[]
    createMany?: MobilePushTokenCreateManyUserInputEnvelope
    connect?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
  }

  export type PasswordResetTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
  }

  export type UserAuthIdentityCreateNestedManyWithoutUserInput = {
    create?: XOR<UserAuthIdentityCreateWithoutUserInput, UserAuthIdentityUncheckedCreateWithoutUserInput> | UserAuthIdentityCreateWithoutUserInput[] | UserAuthIdentityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserAuthIdentityCreateOrConnectWithoutUserInput | UserAuthIdentityCreateOrConnectWithoutUserInput[]
    createMany?: UserAuthIdentityCreateManyUserInputEnvelope
    connect?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
  }

  export type OrganizationUncheckedCreateNestedOneWithoutOwnerInput = {
    create?: XOR<OrganizationCreateWithoutOwnerInput, OrganizationUncheckedCreateWithoutOwnerInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutOwnerInput
    connect?: OrganizationWhereUniqueInput
  }

  export type MobilePushTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<MobilePushTokenCreateWithoutUserInput, MobilePushTokenUncheckedCreateWithoutUserInput> | MobilePushTokenCreateWithoutUserInput[] | MobilePushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MobilePushTokenCreateOrConnectWithoutUserInput | MobilePushTokenCreateOrConnectWithoutUserInput[]
    createMany?: MobilePushTokenCreateManyUserInputEnvelope
    connect?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
  }

  export type PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
  }

  export type UserAuthIdentityUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserAuthIdentityCreateWithoutUserInput, UserAuthIdentityUncheckedCreateWithoutUserInput> | UserAuthIdentityCreateWithoutUserInput[] | UserAuthIdentityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserAuthIdentityCreateOrConnectWithoutUserInput | UserAuthIdentityCreateOrConnectWithoutUserInput[]
    createMany?: UserAuthIdentityCreateManyUserInputEnvelope
    connect?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
  }

  export type OrganizationUpdateOneWithoutOwnerNestedInput = {
    create?: XOR<OrganizationCreateWithoutOwnerInput, OrganizationUncheckedCreateWithoutOwnerInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutOwnerInput
    upsert?: OrganizationUpsertWithoutOwnerInput
    disconnect?: OrganizationWhereInput | boolean
    delete?: OrganizationWhereInput | boolean
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutOwnerInput, OrganizationUpdateWithoutOwnerInput>, OrganizationUncheckedUpdateWithoutOwnerInput>
  }

  export type MobilePushTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<MobilePushTokenCreateWithoutUserInput, MobilePushTokenUncheckedCreateWithoutUserInput> | MobilePushTokenCreateWithoutUserInput[] | MobilePushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MobilePushTokenCreateOrConnectWithoutUserInput | MobilePushTokenCreateOrConnectWithoutUserInput[]
    upsert?: MobilePushTokenUpsertWithWhereUniqueWithoutUserInput | MobilePushTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MobilePushTokenCreateManyUserInputEnvelope
    set?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    disconnect?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    delete?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    connect?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    update?: MobilePushTokenUpdateWithWhereUniqueWithoutUserInput | MobilePushTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MobilePushTokenUpdateManyWithWhereWithoutUserInput | MobilePushTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MobilePushTokenScalarWhereInput | MobilePushTokenScalarWhereInput[]
  }

  export type PasswordResetTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    upsert?: PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput | PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    set?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    disconnect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    delete?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    update?: PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput | PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PasswordResetTokenUpdateManyWithWhereWithoutUserInput | PasswordResetTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
  }

  export type UserAuthIdentityUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserAuthIdentityCreateWithoutUserInput, UserAuthIdentityUncheckedCreateWithoutUserInput> | UserAuthIdentityCreateWithoutUserInput[] | UserAuthIdentityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserAuthIdentityCreateOrConnectWithoutUserInput | UserAuthIdentityCreateOrConnectWithoutUserInput[]
    upsert?: UserAuthIdentityUpsertWithWhereUniqueWithoutUserInput | UserAuthIdentityUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserAuthIdentityCreateManyUserInputEnvelope
    set?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    disconnect?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    delete?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    connect?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    update?: UserAuthIdentityUpdateWithWhereUniqueWithoutUserInput | UserAuthIdentityUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserAuthIdentityUpdateManyWithWhereWithoutUserInput | UserAuthIdentityUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserAuthIdentityScalarWhereInput | UserAuthIdentityScalarWhereInput[]
  }

  export type OrganizationUncheckedUpdateOneWithoutOwnerNestedInput = {
    create?: XOR<OrganizationCreateWithoutOwnerInput, OrganizationUncheckedCreateWithoutOwnerInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutOwnerInput
    upsert?: OrganizationUpsertWithoutOwnerInput
    disconnect?: OrganizationWhereInput | boolean
    delete?: OrganizationWhereInput | boolean
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutOwnerInput, OrganizationUpdateWithoutOwnerInput>, OrganizationUncheckedUpdateWithoutOwnerInput>
  }

  export type MobilePushTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<MobilePushTokenCreateWithoutUserInput, MobilePushTokenUncheckedCreateWithoutUserInput> | MobilePushTokenCreateWithoutUserInput[] | MobilePushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MobilePushTokenCreateOrConnectWithoutUserInput | MobilePushTokenCreateOrConnectWithoutUserInput[]
    upsert?: MobilePushTokenUpsertWithWhereUniqueWithoutUserInput | MobilePushTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MobilePushTokenCreateManyUserInputEnvelope
    set?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    disconnect?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    delete?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    connect?: MobilePushTokenWhereUniqueInput | MobilePushTokenWhereUniqueInput[]
    update?: MobilePushTokenUpdateWithWhereUniqueWithoutUserInput | MobilePushTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MobilePushTokenUpdateManyWithWhereWithoutUserInput | MobilePushTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MobilePushTokenScalarWhereInput | MobilePushTokenScalarWhereInput[]
  }

  export type PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    upsert?: PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput | PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    set?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    disconnect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    delete?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    update?: PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput | PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PasswordResetTokenUpdateManyWithWhereWithoutUserInput | PasswordResetTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
  }

  export type UserAuthIdentityUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserAuthIdentityCreateWithoutUserInput, UserAuthIdentityUncheckedCreateWithoutUserInput> | UserAuthIdentityCreateWithoutUserInput[] | UserAuthIdentityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserAuthIdentityCreateOrConnectWithoutUserInput | UserAuthIdentityCreateOrConnectWithoutUserInput[]
    upsert?: UserAuthIdentityUpsertWithWhereUniqueWithoutUserInput | UserAuthIdentityUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserAuthIdentityCreateManyUserInputEnvelope
    set?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    disconnect?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    delete?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    connect?: UserAuthIdentityWhereUniqueInput | UserAuthIdentityWhereUniqueInput[]
    update?: UserAuthIdentityUpdateWithWhereUniqueWithoutUserInput | UserAuthIdentityUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserAuthIdentityUpdateManyWithWhereWithoutUserInput | UserAuthIdentityUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserAuthIdentityScalarWhereInput | UserAuthIdentityScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutAuth_identitiesInput = {
    create?: XOR<UserCreateWithoutAuth_identitiesInput, UserUncheckedCreateWithoutAuth_identitiesInput>
    connectOrCreate?: UserCreateOrConnectWithoutAuth_identitiesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutAuth_identitiesNestedInput = {
    create?: XOR<UserCreateWithoutAuth_identitiesInput, UserUncheckedCreateWithoutAuth_identitiesInput>
    connectOrCreate?: UserCreateOrConnectWithoutAuth_identitiesInput
    upsert?: UserUpsertWithoutAuth_identitiesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAuth_identitiesInput, UserUpdateWithoutAuth_identitiesInput>, UserUncheckedUpdateWithoutAuth_identitiesInput>
  }

  export type UserCreateNestedOneWithoutMobile_push_tokensInput = {
    create?: XOR<UserCreateWithoutMobile_push_tokensInput, UserUncheckedCreateWithoutMobile_push_tokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutMobile_push_tokensInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutMobile_push_tokensNestedInput = {
    create?: XOR<UserCreateWithoutMobile_push_tokensInput, UserUncheckedCreateWithoutMobile_push_tokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutMobile_push_tokensInput
    upsert?: UserUpsertWithoutMobile_push_tokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMobile_push_tokensInput, UserUpdateWithoutMobile_push_tokensInput>, UserUncheckedUpdateWithoutMobile_push_tokensInput>
  }

  export type UserCreateNestedOneWithoutPassword_reset_tokensInput = {
    create?: XOR<UserCreateWithoutPassword_reset_tokensInput, UserUncheckedCreateWithoutPassword_reset_tokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutPassword_reset_tokensInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutPassword_reset_tokensNestedInput = {
    create?: XOR<UserCreateWithoutPassword_reset_tokensInput, UserUncheckedCreateWithoutPassword_reset_tokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutPassword_reset_tokensInput
    upsert?: UserUpsertWithoutPassword_reset_tokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPassword_reset_tokensInput, UserUpdateWithoutPassword_reset_tokensInput>, UserUncheckedUpdateWithoutPassword_reset_tokensInput>
  }

  export type UserOrganizationCreatepermissionsInput = {
    set: $Enums.Permission[]
  }

  export type OrganizationCreateNestedOneWithoutMembersInput = {
    create?: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutMembersInput
    connect?: OrganizationWhereUniqueInput
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type UserOrganizationUpdatepermissionsInput = {
    set?: $Enums.Permission[]
    push?: $Enums.Permission | $Enums.Permission[]
  }

  export type OrganizationUpdateOneRequiredWithoutMembersNestedInput = {
    create?: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutMembersInput
    upsert?: OrganizationUpsertWithoutMembersInput
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutMembersInput, OrganizationUpdateWithoutMembersInput>, OrganizationUncheckedUpdateWithoutMembersInput>
  }

  export type OrganizationCreateNestedOneWithoutInvitesInput = {
    create?: XOR<OrganizationCreateWithoutInvitesInput, OrganizationUncheckedCreateWithoutInvitesInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutInvitesInput
    connect?: OrganizationWhereUniqueInput
  }

  export type OrganizationUpdateOneRequiredWithoutInvitesNestedInput = {
    create?: XOR<OrganizationCreateWithoutInvitesInput, OrganizationUncheckedCreateWithoutInvitesInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutInvitesInput
    upsert?: OrganizationUpsertWithoutInvitesInput
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutInvitesInput, OrganizationUpdateWithoutInvitesInput>, OrganizationUncheckedUpdateWithoutInvitesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumSubscriptionStatusNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumSubscriptionStatusNullableFilter<$PrismaModel> | $Enums.SubscriptionStatus | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumSubscriptionStatusNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumSubscriptionStatusNullableWithAggregatesFilter<$PrismaModel> | $Enums.SubscriptionStatus | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumSubscriptionStatusNullableFilter<$PrismaModel>
    _max?: NestedEnumSubscriptionStatusNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type UserCreateWithoutOwned_organizationInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    mobile_push_tokens?: MobilePushTokenCreateNestedManyWithoutUserInput
    password_reset_tokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutOwned_organizationInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    mobile_push_tokens?: MobilePushTokenUncheckedCreateNestedManyWithoutUserInput
    password_reset_tokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutOwned_organizationInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutOwned_organizationInput, UserUncheckedCreateWithoutOwned_organizationInput>
  }

  export type UserOrganizationCreateWithoutOrganizationInput = {
    id?: string
    user_id: string
    store_id: string
    role?: $Enums.Role
    permissions?: UserOrganizationCreatepermissionsInput | $Enums.Permission[]
    approved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserOrganizationUncheckedCreateWithoutOrganizationInput = {
    id?: string
    user_id: string
    store_id: string
    role?: $Enums.Role
    permissions?: UserOrganizationCreatepermissionsInput | $Enums.Permission[]
    approved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserOrganizationCreateOrConnectWithoutOrganizationInput = {
    where: UserOrganizationWhereUniqueInput
    create: XOR<UserOrganizationCreateWithoutOrganizationInput, UserOrganizationUncheckedCreateWithoutOrganizationInput>
  }

  export type UserOrganizationCreateManyOrganizationInputEnvelope = {
    data: UserOrganizationCreateManyOrganizationInput | UserOrganizationCreateManyOrganizationInput[]
    skipDuplicates?: boolean
  }

  export type StoreInviteCreateWithoutOrganizationInput = {
    id?: string
    store_id: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    revoked_at?: Date | string | null
    created_by: string
    created_at?: Date | string
  }

  export type StoreInviteUncheckedCreateWithoutOrganizationInput = {
    id?: string
    store_id: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    revoked_at?: Date | string | null
    created_by: string
    created_at?: Date | string
  }

  export type StoreInviteCreateOrConnectWithoutOrganizationInput = {
    where: StoreInviteWhereUniqueInput
    create: XOR<StoreInviteCreateWithoutOrganizationInput, StoreInviteUncheckedCreateWithoutOrganizationInput>
  }

  export type StoreInviteCreateManyOrganizationInputEnvelope = {
    data: StoreInviteCreateManyOrganizationInput | StoreInviteCreateManyOrganizationInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutOwned_organizationInput = {
    update: XOR<UserUpdateWithoutOwned_organizationInput, UserUncheckedUpdateWithoutOwned_organizationInput>
    create: XOR<UserCreateWithoutOwned_organizationInput, UserUncheckedCreateWithoutOwned_organizationInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutOwned_organizationInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutOwned_organizationInput, UserUncheckedUpdateWithoutOwned_organizationInput>
  }

  export type UserUpdateWithoutOwned_organizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    mobile_push_tokens?: MobilePushTokenUpdateManyWithoutUserNestedInput
    password_reset_tokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutOwned_organizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    mobile_push_tokens?: MobilePushTokenUncheckedUpdateManyWithoutUserNestedInput
    password_reset_tokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserOrganizationUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: UserOrganizationWhereUniqueInput
    update: XOR<UserOrganizationUpdateWithoutOrganizationInput, UserOrganizationUncheckedUpdateWithoutOrganizationInput>
    create: XOR<UserOrganizationCreateWithoutOrganizationInput, UserOrganizationUncheckedCreateWithoutOrganizationInput>
  }

  export type UserOrganizationUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: UserOrganizationWhereUniqueInput
    data: XOR<UserOrganizationUpdateWithoutOrganizationInput, UserOrganizationUncheckedUpdateWithoutOrganizationInput>
  }

  export type UserOrganizationUpdateManyWithWhereWithoutOrganizationInput = {
    where: UserOrganizationScalarWhereInput
    data: XOR<UserOrganizationUpdateManyMutationInput, UserOrganizationUncheckedUpdateManyWithoutOrganizationInput>
  }

  export type UserOrganizationScalarWhereInput = {
    AND?: UserOrganizationScalarWhereInput | UserOrganizationScalarWhereInput[]
    OR?: UserOrganizationScalarWhereInput[]
    NOT?: UserOrganizationScalarWhereInput | UserOrganizationScalarWhereInput[]
    id?: StringFilter<"UserOrganization"> | string
    user_id?: StringFilter<"UserOrganization"> | string
    organization_id?: StringFilter<"UserOrganization"> | string
    store_id?: StringFilter<"UserOrganization"> | string
    role?: EnumRoleFilter<"UserOrganization"> | $Enums.Role
    permissions?: EnumPermissionNullableListFilter<"UserOrganization">
    approved?: BoolFilter<"UserOrganization"> | boolean
    created_at?: DateTimeFilter<"UserOrganization"> | Date | string
    updated_at?: DateTimeFilter<"UserOrganization"> | Date | string
  }

  export type StoreInviteUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: StoreInviteWhereUniqueInput
    update: XOR<StoreInviteUpdateWithoutOrganizationInput, StoreInviteUncheckedUpdateWithoutOrganizationInput>
    create: XOR<StoreInviteCreateWithoutOrganizationInput, StoreInviteUncheckedCreateWithoutOrganizationInput>
  }

  export type StoreInviteUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: StoreInviteWhereUniqueInput
    data: XOR<StoreInviteUpdateWithoutOrganizationInput, StoreInviteUncheckedUpdateWithoutOrganizationInput>
  }

  export type StoreInviteUpdateManyWithWhereWithoutOrganizationInput = {
    where: StoreInviteScalarWhereInput
    data: XOR<StoreInviteUpdateManyMutationInput, StoreInviteUncheckedUpdateManyWithoutOrganizationInput>
  }

  export type StoreInviteScalarWhereInput = {
    AND?: StoreInviteScalarWhereInput | StoreInviteScalarWhereInput[]
    OR?: StoreInviteScalarWhereInput[]
    NOT?: StoreInviteScalarWhereInput | StoreInviteScalarWhereInput[]
    id?: StringFilter<"StoreInvite"> | string
    organization_id?: StringFilter<"StoreInvite"> | string
    store_id?: StringFilter<"StoreInvite"> | string
    token_hash?: StringFilter<"StoreInvite"> | string
    expires_at?: DateTimeFilter<"StoreInvite"> | Date | string
    used_at?: DateTimeNullableFilter<"StoreInvite"> | Date | string | null
    revoked_at?: DateTimeNullableFilter<"StoreInvite"> | Date | string | null
    created_by?: StringFilter<"StoreInvite"> | string
    created_at?: DateTimeFilter<"StoreInvite"> | Date | string
  }

  export type OrganizationCreateWithoutOwnerInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    members?: UserOrganizationCreateNestedManyWithoutOrganizationInput
    invites?: StoreInviteCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateWithoutOwnerInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    members?: UserOrganizationUncheckedCreateNestedManyWithoutOrganizationInput
    invites?: StoreInviteUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationCreateOrConnectWithoutOwnerInput = {
    where: OrganizationWhereUniqueInput
    create: XOR<OrganizationCreateWithoutOwnerInput, OrganizationUncheckedCreateWithoutOwnerInput>
  }

  export type MobilePushTokenCreateWithoutUserInput = {
    id?: string
    token: string
    platform: string
    provider: string
    device_name?: string | null
    app_version?: string | null
    build_number?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    last_seen_at?: Date | string
  }

  export type MobilePushTokenUncheckedCreateWithoutUserInput = {
    id?: string
    token: string
    platform: string
    provider: string
    device_name?: string | null
    app_version?: string | null
    build_number?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    last_seen_at?: Date | string
  }

  export type MobilePushTokenCreateOrConnectWithoutUserInput = {
    where: MobilePushTokenWhereUniqueInput
    create: XOR<MobilePushTokenCreateWithoutUserInput, MobilePushTokenUncheckedCreateWithoutUserInput>
  }

  export type MobilePushTokenCreateManyUserInputEnvelope = {
    data: MobilePushTokenCreateManyUserInput | MobilePushTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type PasswordResetTokenCreateWithoutUserInput = {
    id?: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    created_at?: Date | string
  }

  export type PasswordResetTokenUncheckedCreateWithoutUserInput = {
    id?: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    created_at?: Date | string
  }

  export type PasswordResetTokenCreateOrConnectWithoutUserInput = {
    where: PasswordResetTokenWhereUniqueInput
    create: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput>
  }

  export type PasswordResetTokenCreateManyUserInputEnvelope = {
    data: PasswordResetTokenCreateManyUserInput | PasswordResetTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserAuthIdentityCreateWithoutUserInput = {
    id?: string
    provider: string
    provider_user_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserAuthIdentityUncheckedCreateWithoutUserInput = {
    id?: string
    provider: string
    provider_user_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type UserAuthIdentityCreateOrConnectWithoutUserInput = {
    where: UserAuthIdentityWhereUniqueInput
    create: XOR<UserAuthIdentityCreateWithoutUserInput, UserAuthIdentityUncheckedCreateWithoutUserInput>
  }

  export type UserAuthIdentityCreateManyUserInputEnvelope = {
    data: UserAuthIdentityCreateManyUserInput | UserAuthIdentityCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type OrganizationUpsertWithoutOwnerInput = {
    update: XOR<OrganizationUpdateWithoutOwnerInput, OrganizationUncheckedUpdateWithoutOwnerInput>
    create: XOR<OrganizationCreateWithoutOwnerInput, OrganizationUncheckedCreateWithoutOwnerInput>
    where?: OrganizationWhereInput
  }

  export type OrganizationUpdateToOneWithWhereWithoutOwnerInput = {
    where?: OrganizationWhereInput
    data: XOR<OrganizationUpdateWithoutOwnerInput, OrganizationUncheckedUpdateWithoutOwnerInput>
  }

  export type OrganizationUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    members?: UserOrganizationUpdateManyWithoutOrganizationNestedInput
    invites?: StoreInviteUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    members?: UserOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput
    invites?: StoreInviteUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type MobilePushTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: MobilePushTokenWhereUniqueInput
    update: XOR<MobilePushTokenUpdateWithoutUserInput, MobilePushTokenUncheckedUpdateWithoutUserInput>
    create: XOR<MobilePushTokenCreateWithoutUserInput, MobilePushTokenUncheckedCreateWithoutUserInput>
  }

  export type MobilePushTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: MobilePushTokenWhereUniqueInput
    data: XOR<MobilePushTokenUpdateWithoutUserInput, MobilePushTokenUncheckedUpdateWithoutUserInput>
  }

  export type MobilePushTokenUpdateManyWithWhereWithoutUserInput = {
    where: MobilePushTokenScalarWhereInput
    data: XOR<MobilePushTokenUpdateManyMutationInput, MobilePushTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type MobilePushTokenScalarWhereInput = {
    AND?: MobilePushTokenScalarWhereInput | MobilePushTokenScalarWhereInput[]
    OR?: MobilePushTokenScalarWhereInput[]
    NOT?: MobilePushTokenScalarWhereInput | MobilePushTokenScalarWhereInput[]
    id?: StringFilter<"MobilePushToken"> | string
    user_id?: StringFilter<"MobilePushToken"> | string
    token?: StringFilter<"MobilePushToken"> | string
    platform?: StringFilter<"MobilePushToken"> | string
    provider?: StringFilter<"MobilePushToken"> | string
    device_name?: StringNullableFilter<"MobilePushToken"> | string | null
    app_version?: StringNullableFilter<"MobilePushToken"> | string | null
    build_number?: StringNullableFilter<"MobilePushToken"> | string | null
    created_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    updated_at?: DateTimeFilter<"MobilePushToken"> | Date | string
    last_seen_at?: DateTimeFilter<"MobilePushToken"> | Date | string
  }

  export type PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: PasswordResetTokenWhereUniqueInput
    update: XOR<PasswordResetTokenUpdateWithoutUserInput, PasswordResetTokenUncheckedUpdateWithoutUserInput>
    create: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput>
  }

  export type PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: PasswordResetTokenWhereUniqueInput
    data: XOR<PasswordResetTokenUpdateWithoutUserInput, PasswordResetTokenUncheckedUpdateWithoutUserInput>
  }

  export type PasswordResetTokenUpdateManyWithWhereWithoutUserInput = {
    where: PasswordResetTokenScalarWhereInput
    data: XOR<PasswordResetTokenUpdateManyMutationInput, PasswordResetTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type PasswordResetTokenScalarWhereInput = {
    AND?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
    OR?: PasswordResetTokenScalarWhereInput[]
    NOT?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
    id?: StringFilter<"PasswordResetToken"> | string
    token_hash?: StringFilter<"PasswordResetToken"> | string
    user_id?: StringFilter<"PasswordResetToken"> | string
    expires_at?: DateTimeFilter<"PasswordResetToken"> | Date | string
    used_at?: DateTimeNullableFilter<"PasswordResetToken"> | Date | string | null
    created_at?: DateTimeFilter<"PasswordResetToken"> | Date | string
  }

  export type UserAuthIdentityUpsertWithWhereUniqueWithoutUserInput = {
    where: UserAuthIdentityWhereUniqueInput
    update: XOR<UserAuthIdentityUpdateWithoutUserInput, UserAuthIdentityUncheckedUpdateWithoutUserInput>
    create: XOR<UserAuthIdentityCreateWithoutUserInput, UserAuthIdentityUncheckedCreateWithoutUserInput>
  }

  export type UserAuthIdentityUpdateWithWhereUniqueWithoutUserInput = {
    where: UserAuthIdentityWhereUniqueInput
    data: XOR<UserAuthIdentityUpdateWithoutUserInput, UserAuthIdentityUncheckedUpdateWithoutUserInput>
  }

  export type UserAuthIdentityUpdateManyWithWhereWithoutUserInput = {
    where: UserAuthIdentityScalarWhereInput
    data: XOR<UserAuthIdentityUpdateManyMutationInput, UserAuthIdentityUncheckedUpdateManyWithoutUserInput>
  }

  export type UserAuthIdentityScalarWhereInput = {
    AND?: UserAuthIdentityScalarWhereInput | UserAuthIdentityScalarWhereInput[]
    OR?: UserAuthIdentityScalarWhereInput[]
    NOT?: UserAuthIdentityScalarWhereInput | UserAuthIdentityScalarWhereInput[]
    id?: StringFilter<"UserAuthIdentity"> | string
    user_id?: StringFilter<"UserAuthIdentity"> | string
    provider?: StringFilter<"UserAuthIdentity"> | string
    provider_user_id?: StringFilter<"UserAuthIdentity"> | string
    created_at?: DateTimeFilter<"UserAuthIdentity"> | Date | string
    updated_at?: DateTimeFilter<"UserAuthIdentity"> | Date | string
  }

  export type UserCreateWithoutAuth_identitiesInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationCreateNestedOneWithoutOwnerInput
    mobile_push_tokens?: MobilePushTokenCreateNestedManyWithoutUserInput
    password_reset_tokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutAuth_identitiesInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationUncheckedCreateNestedOneWithoutOwnerInput
    mobile_push_tokens?: MobilePushTokenUncheckedCreateNestedManyWithoutUserInput
    password_reset_tokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutAuth_identitiesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAuth_identitiesInput, UserUncheckedCreateWithoutAuth_identitiesInput>
  }

  export type UserUpsertWithoutAuth_identitiesInput = {
    update: XOR<UserUpdateWithoutAuth_identitiesInput, UserUncheckedUpdateWithoutAuth_identitiesInput>
    create: XOR<UserCreateWithoutAuth_identitiesInput, UserUncheckedCreateWithoutAuth_identitiesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAuth_identitiesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAuth_identitiesInput, UserUncheckedUpdateWithoutAuth_identitiesInput>
  }

  export type UserUpdateWithoutAuth_identitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUpdateOneWithoutOwnerNestedInput
    mobile_push_tokens?: MobilePushTokenUpdateManyWithoutUserNestedInput
    password_reset_tokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutAuth_identitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUncheckedUpdateOneWithoutOwnerNestedInput
    mobile_push_tokens?: MobilePushTokenUncheckedUpdateManyWithoutUserNestedInput
    password_reset_tokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutMobile_push_tokensInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationCreateNestedOneWithoutOwnerInput
    password_reset_tokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutMobile_push_tokensInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationUncheckedCreateNestedOneWithoutOwnerInput
    password_reset_tokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutMobile_push_tokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutMobile_push_tokensInput, UserUncheckedCreateWithoutMobile_push_tokensInput>
  }

  export type UserUpsertWithoutMobile_push_tokensInput = {
    update: XOR<UserUpdateWithoutMobile_push_tokensInput, UserUncheckedUpdateWithoutMobile_push_tokensInput>
    create: XOR<UserCreateWithoutMobile_push_tokensInput, UserUncheckedCreateWithoutMobile_push_tokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutMobile_push_tokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutMobile_push_tokensInput, UserUncheckedUpdateWithoutMobile_push_tokensInput>
  }

  export type UserUpdateWithoutMobile_push_tokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUpdateOneWithoutOwnerNestedInput
    password_reset_tokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutMobile_push_tokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUncheckedUpdateOneWithoutOwnerNestedInput
    password_reset_tokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutPassword_reset_tokensInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationCreateNestedOneWithoutOwnerInput
    mobile_push_tokens?: MobilePushTokenCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPassword_reset_tokensInput = {
    id?: string
    name?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    push_token?: string | null
    owned_organization?: OrganizationUncheckedCreateNestedOneWithoutOwnerInput
    mobile_push_tokens?: MobilePushTokenUncheckedCreateNestedManyWithoutUserInput
    auth_identities?: UserAuthIdentityUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPassword_reset_tokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPassword_reset_tokensInput, UserUncheckedCreateWithoutPassword_reset_tokensInput>
  }

  export type UserUpsertWithoutPassword_reset_tokensInput = {
    update: XOR<UserUpdateWithoutPassword_reset_tokensInput, UserUncheckedUpdateWithoutPassword_reset_tokensInput>
    create: XOR<UserCreateWithoutPassword_reset_tokensInput, UserUncheckedCreateWithoutPassword_reset_tokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPassword_reset_tokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPassword_reset_tokensInput, UserUncheckedUpdateWithoutPassword_reset_tokensInput>
  }

  export type UserUpdateWithoutPassword_reset_tokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUpdateOneWithoutOwnerNestedInput
    mobile_push_tokens?: MobilePushTokenUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPassword_reset_tokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    push_token?: NullableStringFieldUpdateOperationsInput | string | null
    owned_organization?: OrganizationUncheckedUpdateOneWithoutOwnerNestedInput
    mobile_push_tokens?: MobilePushTokenUncheckedUpdateManyWithoutUserNestedInput
    auth_identities?: UserAuthIdentityUncheckedUpdateManyWithoutUserNestedInput
  }

  export type OrganizationCreateWithoutMembersInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    owner: UserCreateNestedOneWithoutOwned_organizationInput
    invites?: StoreInviteCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateWithoutMembersInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    owner_id: string
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    invites?: StoreInviteUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationCreateOrConnectWithoutMembersInput = {
    where: OrganizationWhereUniqueInput
    create: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
  }

  export type OrganizationUpsertWithoutMembersInput = {
    update: XOR<OrganizationUpdateWithoutMembersInput, OrganizationUncheckedUpdateWithoutMembersInput>
    create: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
    where?: OrganizationWhereInput
  }

  export type OrganizationUpdateToOneWithWhereWithoutMembersInput = {
    where?: OrganizationWhereInput
    data: XOR<OrganizationUpdateWithoutMembersInput, OrganizationUncheckedUpdateWithoutMembersInput>
  }

  export type OrganizationUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    owner?: UserUpdateOneRequiredWithoutOwned_organizationNestedInput
    invites?: StoreInviteUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    invites?: StoreInviteUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationCreateWithoutInvitesInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    owner: UserCreateNestedOneWithoutOwned_organizationInput
    members?: UserOrganizationCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateWithoutInvitesInput = {
    id?: string
    name: string
    slug: string
    created_at?: Date | string
    updated_at?: Date | string
    subscription_id?: string | null
    subscription_status?: $Enums.SubscriptionStatus | null
    subscription_ends_at?: Date | string | null
    owner_id: string
    uzum_fastpay_enabled?: boolean
    uzum_fastpay_merchant_id?: string | null
    uzum_fastpay_secret_key?: string | null
    uzum_fastpay_service_id?: string | null
    uzum_fastpay_merchant_service_user_id?: string | null
    ecommerce_enabled?: boolean
    members?: UserOrganizationUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationCreateOrConnectWithoutInvitesInput = {
    where: OrganizationWhereUniqueInput
    create: XOR<OrganizationCreateWithoutInvitesInput, OrganizationUncheckedCreateWithoutInvitesInput>
  }

  export type OrganizationUpsertWithoutInvitesInput = {
    update: XOR<OrganizationUpdateWithoutInvitesInput, OrganizationUncheckedUpdateWithoutInvitesInput>
    create: XOR<OrganizationCreateWithoutInvitesInput, OrganizationUncheckedCreateWithoutInvitesInput>
    where?: OrganizationWhereInput
  }

  export type OrganizationUpdateToOneWithWhereWithoutInvitesInput = {
    where?: OrganizationWhereInput
    data: XOR<OrganizationUpdateWithoutInvitesInput, OrganizationUncheckedUpdateWithoutInvitesInput>
  }

  export type OrganizationUpdateWithoutInvitesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    owner?: UserUpdateOneRequiredWithoutOwned_organizationNestedInput
    members?: UserOrganizationUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateWithoutInvitesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    subscription_id?: NullableStringFieldUpdateOperationsInput | string | null
    subscription_status?: NullableEnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus | null
    subscription_ends_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uzum_fastpay_enabled?: BoolFieldUpdateOperationsInput | boolean
    uzum_fastpay_merchant_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_secret_key?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_service_id?: NullableStringFieldUpdateOperationsInput | string | null
    uzum_fastpay_merchant_service_user_id?: NullableStringFieldUpdateOperationsInput | string | null
    ecommerce_enabled?: BoolFieldUpdateOperationsInput | boolean
    members?: UserOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type UserOrganizationCreateManyOrganizationInput = {
    id?: string
    user_id: string
    store_id: string
    role?: $Enums.Role
    permissions?: UserOrganizationCreatepermissionsInput | $Enums.Permission[]
    approved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type StoreInviteCreateManyOrganizationInput = {
    id?: string
    store_id: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    revoked_at?: Date | string | null
    created_by: string
    created_at?: Date | string
  }

  export type UserOrganizationUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserOrganizationUncheckedUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserOrganizationUncheckedUpdateManyWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    permissions?: UserOrganizationUpdatepermissionsInput | $Enums.Permission[]
    approved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoreInviteUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoreInviteUncheckedUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StoreInviteUncheckedUpdateManyWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    store_id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revoked_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_by?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MobilePushTokenCreateManyUserInput = {
    id?: string
    token: string
    platform: string
    provider: string
    device_name?: string | null
    app_version?: string | null
    build_number?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    last_seen_at?: Date | string
  }

  export type PasswordResetTokenCreateManyUserInput = {
    id?: string
    token_hash: string
    expires_at: Date | string
    used_at?: Date | string | null
    created_at?: Date | string
  }

  export type UserAuthIdentityCreateManyUserInput = {
    id?: string
    provider: string
    provider_user_id: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type MobilePushTokenUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MobilePushTokenUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MobilePushTokenUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    device_name?: NullableStringFieldUpdateOperationsInput | string | null
    app_version?: NullableStringFieldUpdateOperationsInput | string | null
    build_number?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_seen_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token_hash?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserAuthIdentityUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserAuthIdentityUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserAuthIdentityUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_user_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}