/* TSMHST Portal — biometric check-in (WebAuthn platform authenticator).
   Students register their phone's fingerprint/face once; at check-in the
   same credential must produce a signed assertion with user verification
   required, and the signature is verified locally against the public key
   saved at registration. No server needed; unsupported browsers fall
   back to the secretary desk. */
const Bio = (function () {
  function b64(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let out = '';
    for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return btoa(out);
  }
  function b64url(buf) { return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function fromB64(str) {
    const norm = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(norm + '='.repeat((4 - norm.length % 4) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function randomChallenge() { return window.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(32)) : new Uint8Array(32); }
  function sameBytes(a, b) { return a.length === b.length && a.every((v, i) => v === b[i]); }

  function supported() {
    return !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
  }

  async function platformAvailable() {
    if (!supported()) return false;
    try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); }
    catch (e) { return false; }
  }

  function algSpec(alg) {
    return alg === -257 ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } : { name: 'ECDSA', hash: 'SHA-256' };
  }

  /* One-time: create a device-bound, user-verifying credential for a student. */
  async function register(user) {
    if (!supported()) return { error: 'unsupported' };
    const available = await platformAvailable();
    if (!available) return { error: 'no-sensor' };
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { id: location.hostname, name: 'TSMHST Portal' },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.admissionNo || user.email,
            displayName: user.name
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'discouraged',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });
      const resp = cred.response;
      const record = {
        credentialId: b64url(cred.rawId),
        alg: resp.publicKeyAlgorithm !== undefined ? resp.publicKeyAlgorithm : -7,
        registeredAt: new Date().toISOString()
      };
      if (typeof resp.getPublicKey === 'function') {
        const spki = new Uint8Array(resp.getPublicKey());
        record.publicKey = b64(spki);
      }
      return { ok: true, record, credential: cred };
    } catch (err) {
      const name = err && err.name;
      if (name === 'NotAllowedError') return { error: 'cancelled' };
      if (name === 'InvalidStateError') return { error: 'already-registered' };
      return { error: 'failed' };
    }
  }

  /* Verify a student at the gate: the registered credential must sign a
     fresh challenge after a fingerprint/face unlock. The signature is
     checked locally against the stored public key when available. */
  async function verify(user) {
    if (!user || !user.bioCredentialId) return { error: 'not-registered' };
    if (!supported()) return { error: 'unsupported' };
    const challenge = randomChallenge();
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: location.hostname,
          allowCredentials: [{ id: fromB64(user.bioCredentialId), type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000
        }
      });
      const r = assertion.response;
      const clientData = JSON.parse(new TextDecoder().decode(r.clientDataJSON));
      if (clientData.type !== 'webauthn.get') return { error: 'failed' };
      if (!sameBytes(fromB64(clientData.challenge), challenge)) return { error: 'failed' };
      const authData = new Uint8Array(r.authenticatorData);
      if (!(authData[32] & 0x04)) return { error: 'no-user-verification' };
      if (user.bioPublicKey) {
        const clientHash = new Uint8Array(await crypto.subtle.digest('SHA-256', r.clientDataJSON));
        const signed = new Uint8Array(authData.length + clientHash.length);
        signed.set(authData);
        signed.set(clientHash, authData.length);
        const key = await crypto.subtle.importKey(
          'spki', fromB64(user.bioPublicKey), algSpec(user.bioAlg !== undefined ? user.bioAlg : -7), false, ['verify']
        );
        const ok = await crypto.subtle.verify(algSpec(user.bioAlg !== undefined ? user.bioAlg : -7), key, new Uint8Array(r.signature), signed);
        if (!ok) return { error: 'failed' };
      }
      return { ok: true };
    } catch (err) {
      const name = err && err.name;
      if (name === 'NotAllowedError') return { error: 'cancelled' };
      return { error: 'failed' };
    }
  }

  return { supported, platformAvailable, register, verify, b64url, fromB64 };
})();
