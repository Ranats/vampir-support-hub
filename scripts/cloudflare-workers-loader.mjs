const CLOUDFLARE_WORKERS_STUB =
  "data:text/javascript,export%20const%20env%20%3D%20Object.create(null)%3B";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: CLOUDFLARE_WORKERS_STUB, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
