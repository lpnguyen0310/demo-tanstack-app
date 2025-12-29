import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/demo/about"!</div>
}
