interface responseType {
    data:any,
    message:string,
    error:any
}

export const FormatResponseJSON=(message:string,data:any,error:any,):{
    data:any,
    message:string,
    error:any

}=>{
return {
      data: data,
      message: message,
      error: error,
    }
}