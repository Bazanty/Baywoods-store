// In-memory stand-in for the Supabase JS client, scoped to the query surface
// the checkout/reservation code actually touches:
//   from(table).select().in/eq/is/lte().limit().maybeSingle()/single()
//   rpc(name)
// It is intentionally not a full client — just enough to drive the safety
// tests without a live Postgres instance.

export type Row = Record<string, unknown>;

type FilterOp = "eq" | "in" | "is" | "lte";

interface Filter {
  op: FilterOp;
  column: string;
  value: unknown;
}

export interface QueryResult {
  data: Row | Row[] | null;
  error: { message: string } | null;
}

function rowMatches(row: Row, filters: Filter[]): boolean {
  for (const f of filters) {
    const cell = row[f.column];
    switch (f.op) {
      case "eq":
        if (cell !== f.value) return false;
        break;
      case "in":
        if (!Array.isArray(f.value) || !f.value.includes(cell)) return false;
        break;
      case "is":
        // `.is(col, null)` matches both explicit null and an absent column.
        if (f.value === null) {
          if (cell !== null && cell !== undefined) return false;
        } else if (cell !== f.value) {
          return false;
        }
        break;
      case "lte":
        if (!((cell as string) <= (f.value as string))) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

class FakeQuery implements PromiseLike<QueryResult> {
  private readonly filters: Filter[] = [];
  private mode: "list" | "single" | "maybeSingle" = "list";

  constructor(
    private readonly rows: Row[],
    private readonly forcedError: { message: string } | null
  ) {}

  select(_columns?: string): this {
    return this;
  }
  in(column: string, value: unknown[]): this {
    this.filters.push({ op: "in", column, value });
    return this;
  }
  eq(column: string, value: unknown): this {
    this.filters.push({ op: "eq", column, value });
    return this;
  }
  is(column: string, value: unknown): this {
    this.filters.push({ op: "is", column, value });
    return this;
  }
  lte(column: string, value: unknown): this {
    this.filters.push({ op: "lte", column, value });
    return this;
  }
  limit(_count: number): this {
    return this;
  }
  single(): this {
    this.mode = "single";
    return this;
  }
  maybeSingle(): this {
    this.mode = "maybeSingle";
    return this;
  }

  private settle(): QueryResult {
    if (this.forcedError) return { data: null, error: this.forcedError };
    const matched = this.rows.filter((row) => rowMatches(row, this.filters));
    if (this.mode === "single") {
      return matched.length === 1
        ? { data: matched[0]!, error: null }
        : { data: null, error: { message: "no rows returned" } };
    }
    if (this.mode === "maybeSingle") {
      return { data: matched[0] ?? null, error: null };
    }
    return { data: matched, error: null };
  }

  then<R1 = QueryResult, R2 = never>(
    onfulfilled?: ((value: QueryResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return Promise.resolve(this.settle()).then(onfulfilled, onrejected);
  }
}

export interface FakeDbConfig {
  products?: Row[];
  coupons?: Row[];
  inventory?: Row[];
  cart_reservations?: Row[];
  // Force a query against the given table to resolve with an error, used to
  // exercise the failure branches (OUT_OF_STOCK, RESERVATION_CHECK_FAILED).
  tableErrors?: Record<string, { message: string }>;
  // Stub return values for `db.rpc(name)` calls.
  rpc?: Record<string, QueryResult>;
}

export function makeFakeDb(config: FakeDbConfig = {}) {
  const tables: Record<string, Row[]> = {
    products: config.products ?? [],
    coupons: config.coupons ?? [],
    inventory: config.inventory ?? [],
    cart_reservations: config.cart_reservations ?? [],
  };

  return {
    from(table: string): FakeQuery {
      return new FakeQuery(tables[table] ?? [], config.tableErrors?.[table] ?? null);
    },
    async rpc(name: string): Promise<QueryResult> {
      return config.rpc?.[name] ?? { data: null, error: null };
    },
  };
}

export type FakeDb = ReturnType<typeof makeFakeDb>;
