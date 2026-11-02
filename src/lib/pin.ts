// Supabase exige contraseñas de al menos 6 caracteres, pero el login usa un PIN
// de 4 dígitos. La contraseña real es el PIN con un prefijo fijo; no añade
// secreto (la seguridad sigue siendo la del PIN), solo cumple la longitud mínima.
export const PIN_LENGTH = 4;

export function pinToPassword(pin: string) {
  return `epack-${pin}`;
}
