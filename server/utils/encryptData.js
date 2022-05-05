module.exports = ( data, multiplier ) => {
    const encryptedData = {...data};

    Object.keys(data).forEach(key => {
        if(key != "accident"){
            encryptedData[key]*=multiplier;
        }
    })
    
    return encryptedData;
}