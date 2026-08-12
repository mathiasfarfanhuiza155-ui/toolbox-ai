const CACHE_NAME =
    "morvix-ai-v3";

const FILES = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/manifest.json"
];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            ).then(
                cache =>
                    cache.addAll(
                        FILES
                    )
            )

        );

        self.skipWaiting();
    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(
                    keys =>
                        Promise.all(
                            keys
                                .filter(
                                    key =>
                                        key !==
                                        CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )
                        )
                )

        );

        self.clients.claim();
    }
);


self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.url.includes(
                "/api/"
            )
        ) {
            return;
        }

        event.respondWith(

            fetch(
                event.request
            ).catch(
                () =>
                    caches.match(
                        event.request
                    )
            )

        );
    }
);
