import React from "react";
import { useCurrentUser } from "../api";

export function HelpBeacon() {
    const currentUser = useCurrentUser();
    const isAuthenticated = currentUser.isAuthenticated;
    const test = Beacon();
    test("init", "a108cc24-88df-4d59-9e84-17ba328fc105");
    test("reset");
    return (
        <div>
            {isAuthenticated ? (
                test('identify', { name: '{{ user.get_full_name }}', email: '{{ user.email }}' })
            ) : (
                test('logout')
            )
            }
        </div>
    )
}

const Beacon = (e, t, n) => {
    function a() {
      var e = t.getElementsByTagName("script")[0],
        n = t.createElement("script");
      (n.type = "text/javascript"),
        (n.async = !0),
        (n.src = "https://beacon-v2.helpscout.net"),
        e.parentNode.insertBefore(n, e);
    }
    if (
      ((e.Beacon = n =
        function (t, n, a) {
          e.Beacon.readyQueue.push({ method: t, options: n, data: a });
        }),
      (n.readyQueue = []),
      "complete" === t.readyState)
    )
      return a();
    e.attachEvent
      ? e.attachEvent("onload", a)
      : e.addEventListener("load", a, !1);
  
}

