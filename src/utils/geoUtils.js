import amapData from "./amapData";

const getGeoCodeAddress = async (latitude, longitude) => {
    const key = amapData.httpKey;
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${longitude},${latitude}&radius=500&extensions=base&roadlevel=0`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "1") {
            return data.regeocode.formatted_address;
        } else {
            throw new Error('Failed to get address from AMap API');
        }
    } catch (error) {
        console.error(error);
        return null;
    }
};

export default getGeoCodeAddress;
