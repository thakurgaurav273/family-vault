// Whether the visitor has a valid session. Set once at boot (src/main.tsx) before React renders.
let signedIn = false;
export const setSignedIn = (v: boolean) => { signedIn = v; };
export const isSignedIn = () => signedIn;
