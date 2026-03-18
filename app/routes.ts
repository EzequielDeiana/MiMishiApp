// app/routes.ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route("login", "./routes/login.tsx"),
  route("register", "./routes/register.tsx"),

  route("", "./routes/protectedRoute.tsx", [
    route("", "./routes/protectedLayout.tsx", [
      index("./routes/home.tsx"),
      route("transactions", "./routes/transactions.tsx"),
      route("profile", "./routes/profile.tsx"),
    ]),
  ]),

] satisfies RouteConfig;