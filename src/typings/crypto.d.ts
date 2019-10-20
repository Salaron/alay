declare module "crypto" {
  // idk why this was removed...
  type Binary = NodeJS.TypedArray | DataView

  function privateDecrypt(privateKey: RsaPrivateKey | KeyLike, buffer: Binary): Buffer
  function privateEncrypt(privateKey: RsaPrivateKey | KeyLike, buffer: Binary): Buffer
}
