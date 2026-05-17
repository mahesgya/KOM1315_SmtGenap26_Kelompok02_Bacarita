import axios from "axios";
import { AppDispatch } from "@/redux/store";
import { GetLevelsResponse } from "@/types/story.types";
import { runWithAuth } from "./_helper";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const StudentServices = {
    GetLevels: async (dispatch : AppDispatch): Promise<GetLevelsResponse> => {
        return runWithAuth<GetLevelsResponse>(dispatch, (token) =>
            axios.get(`${BASE_URL}/students/levels`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
        )   
    },
}

export default StudentServices;