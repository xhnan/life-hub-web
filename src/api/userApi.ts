import { http } from "@/utils/http";

const prefix = '/sys/user'

export function testUserApi(){
    return http.get(`${prefix}/test`);
}