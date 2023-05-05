import React from "react";
import { useCurrentUser } from "../api";

export function HelpBeacon() {
    const currentUser = useCurrentUser();
    const isAuthenticated = currentUser.isAuthenticated;

    // Beacon is a JS object, first call 
    // Beacon('init', 'your beacon id here)
    const test = Beacon();
    test("init", "a108cc24-88df-4d59-9e84-17ba328fc105");
    // Resets the contact form by clearing all of its fields
    test("reset");
    return (
        <div>
            {isAuthenticated ? (
                // This identifies the user
                test('identify', { name: '{{ user.get_full_name }}', email: '{{ user.email }}' })
            ) : (
                // Clears data from the beacon (identify data, device id, history etc)
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

