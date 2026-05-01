import { post } from "@app/core/axios/axios";
import { IAuthLogin, IAuthRegister } from "@app/core/types/auth.types";
import { TResult } from "@app/core/types/TResult";

export const login = async (data: IAuthLogin): Promise<TResult<string>> => {
  return await post<string>("/users/login", data);
};

export const register = async (data: IAuthRegister): Promise<TResult<any>> => {
    return await post<any>("/users", data);
};
