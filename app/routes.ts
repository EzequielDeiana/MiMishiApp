import { type RouteConfig, index, route } from "@react-router/dev/routes";
 
export default [
  route("login", "./routes/login.tsx"),
  route("register", "./routes/register.tsx"),
 
  route("", "./routes/protectedRoute.tsx", [
    route("", "./routes/protectedLayout.tsx", [
      index("./routes/home.tsx"),
      route("transactions", "./routes/transactions.tsx"),
      route("history", "./routes/history.tsx"),
      route("profile", "./routes/profile.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
 