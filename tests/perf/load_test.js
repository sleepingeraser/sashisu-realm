import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // ramp up to 20 VUs
    { duration: "1m", target: 20 }, // stay at 20 VUs for 1 minute
    { duration: "30s", target: 0 }, // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.1"], // error rate below 10%
  },
};

export default function () {
  const res = http.get("http://localhost:3000/api/health");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "body contains ok": (r) =>
      r.body !== null && r.body !== undefined && r.body.includes('"ok":true'),
  });

  sleep(1);
}
