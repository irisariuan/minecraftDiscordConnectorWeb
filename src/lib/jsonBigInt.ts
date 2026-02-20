import JsonBigInt from "json-bigint";

const { parse, stringify } = JsonBigInt({ useNativeBigInt: true });

export { parse, stringify };
