import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "USER" | "LIDER";
  active: boolean;
}

export interface CreateUserDto {
  name: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
}

export const getUsers = async (): Promise<TResult<User[]>> => {
  return await get<User[]>("/users");
};

export const createUser = async (data: CreateUserDto): Promise<TResult<User>> => {
    return await post<User>("/users", data);
};
