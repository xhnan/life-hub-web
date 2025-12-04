import { http } from "@/utils/http";




export function testUserApi(){
    return http.get('/user/test');
}