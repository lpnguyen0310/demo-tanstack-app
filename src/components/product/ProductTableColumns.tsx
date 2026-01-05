import * as React from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/api/product.api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const columnHelper = createColumnHelper<Product>();
const imageShownCache = new Map<string, boolean>();

type UseProductColumnsArgs = {
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  deletePending?: boolean;
};
function ImageWithSpinner({
  id,
  src,
  alt,
}: {
  id: string;
  src: string;
  alt: string;
}) {
  const [showImage, setShowImage] = React.useState(
    () => imageShownCache.get(id) === true
  );

  React.useEffect(() => {
    if (imageShownCache.get(id)) return;

    const t = window.setTimeout(() => {
      imageShownCache.set(id, true);
      setShowImage(true);
    }, 2000);

    return () => window.clearTimeout(t);
  }, [id]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 72, height: 40 }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={72}
          height={40}
          loading="lazy"
          style={{ objectFit: "cover", borderRadius: 4 }}
        />
      ) : (
        <Spinner className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

export function useProductColumns({
  onEdit,
  onDelete,
  deletePending = false,
}: UseProductColumnsArgs) {
  return React.useMemo<ColumnDef<Product, unknown>[]>(() => {
    return [
      columnHelper.display({
        id: "image",
        header: "Image",
        cell: ({ row }) => {
          const p = row.original;
          return <ImageWithSpinner id={p.id} src={p.imageUrl} alt={p.name} />;
        },
      }),

      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row, getValue }) => {
          const p = row.original;
          return (
            <Link to="/product/$id" params={{ id: p.id }} preload="intent">
              {getValue()}
            </Link>
          );
        },
      }),

      columnHelper.accessor("price", {
        header: "Price",
        cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
      }),

      columnHelper.accessor("likes", {
        header: "Likes",
        cell: ({ getValue }) => getValue(),
      }),

      columnHelper.accessor("imageUrl", {
        header: "Image URL",
        cell: ({ getValue }) => {
          const url = getValue();
          return (
            <a href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          );
        },
      }),

      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button type="button" variant="outline" onClick={() => onEdit(p)}>
                Edit
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!window.confirm("Delete this product?")) return;
                  onDelete(p.id);
                }}
                disabled={deletePending}
              >
                Delete
              </Button>
            </div>
          );
        },
      }),
    ];
  }, [deletePending, onDelete, onEdit]);
}
