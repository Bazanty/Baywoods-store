import { getAllProductsServer } from "@/lib/supabase/serverQueries";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getAllProductsServer();
  return <ShopClient allProducts={products} />;
}
