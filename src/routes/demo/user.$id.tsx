import { createFileRoute, notFound } from "@tanstack/react-router";
import { isBuffer } from "util";

export const Route = createFileRoute("/demo/user/$id")({
  component: RouteComponent,
  notFoundComponent: () => <div>User Not Found</div>,
  errorComponent: ({ error }) => (
    <div className="text-red-600">Error: {String(error)}</div>
  ),
  pendingComponent:() => <div>Loading user data...</div>,
  loader: async ({ params }) => {
    if (Number(params.id) > 10) {
      throw notFound();
    }
    try {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users/${params.id}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }
      const users = await res.json();
      if (!users) {
        throw notFound();
      }
      return { users };
    } catch (e) {
      throw new Error("An error occurred while fetching user data");
    }
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const data = Route.useLoaderData();
  console.log("data:", data);

  return (
    <div>
      Hello user user <h1>{data.users.name}</h1>
      <h1>Email: {data.users.email}</h1>
    </div>
  );
}
