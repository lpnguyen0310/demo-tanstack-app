import { createMiddleware } from "@tanstack/react-start";
function auth() {
    // Implement your authentication logic here
    return Math.random() > 0.9; // Example: Randomly allow or deny access

}

export const authMiddleware = createMiddleware({type: "function"}).server( 
   async ({ next }) => {
    if (!auth()) {
      throw new Error("You don't have access to this resource");
    }

    return await next();
  }
);  