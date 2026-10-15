import React, { useEffect, useRef } from "react";
import { useAuth, useDisplayError } from "src/stores";

import { app, authentication } from "./api";

// import { useStateValue } from "./appContext";

function Authentication() {
  // const {
  //   state: { isAuthenticated, hooks_initialized },
  //   dispatch,
  // } = useStateValue();
  const { isAuthenticated, login, logout } = useAuth();
  const displayError = useDisplayError();
  const hooks_initialized = useRef(false);

  // useEffect(() => {
  //   console.log("checking token");
  //   // If we already have a token in the store but Feathers doesn't know about it
  //   if (token && isAuthenticated) {
  //     console.log("set token on feathers");
  //     // Set it manually in the Feathers client
  //     app.set("authentication", { strategy: "jwt", accessToken: token });
  //   }
  // }, [token, isAuthenticated]);

  useEffect(() => {
    if (hooks_initialized.current) {
      return;
    }

    app.hooks({
      error: {
        all: (context) => {
          if (context.params?.connection?.signal?.aborted) {
            return context; // request was cancelled on purpose; caller handles it
          }

          if (context.error && context.error.name === "NotAuthenticated") {
            displayError(context.error);
            // setError(context.error.message);

            logout();
            // dispatch("LOGOUT");
          } else {
            console.error(`Error in ${context.path} calling ${context.method} method`, context.error);
            if (!context.params.noDispatchError) {
              displayError(context.error);
              // setError(context.error.message);
              // dispatch("ERROR", { error: context.error.message });
            }
          }
          return context;
        },
      },
    });
    authentication.hooks({
      after: {
        create: ({ result: { user, accessToken } }) => {
          login(user, accessToken);
          // dispatch("LOGIN", { user });
        },
        remove: () => {
          logout();
          // dispatch("LOGOUT");
        },
      },
    });
    hooks_initialized.current = true;
    // dispatch("INITIALIZE_HOOKS");
  }, [displayError, login, logout]);

  useEffect(() => {
    if (isAuthenticated === null) {
      app
        .reAuthenticate()
        .then(({ user }) => login(user))
        .catch((_e) => {
          logout();
          // dispatch("LOGOUT");
        });
    }
  }, [logout, isAuthenticated, login]);

  return <></>;
}

export default React.memo(Authentication);
