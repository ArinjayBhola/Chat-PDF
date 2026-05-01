import DodoPayments from "dodopayments";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
  environment:
    (process.env.DODO_PAYMENTS_ENVIRONMENT as "live_mode" | "test_mode") ||
    (process.env.NODE_ENV === "production" ? "live_mode" : "test_mode"),
});
