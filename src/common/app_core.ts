import {Result} from "neverthrow";

export interface DomainError {
    code: string;
    msg: string;
}

export type Env = {
    tenantId: string;
    userId: string;
}

export interface HKT<URI, A> {
    readonly _URI: URI
    readonly _A: A
}
