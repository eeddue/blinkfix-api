import { ICuisine } from '../../interfaces/mongo/recipes';
import { Cuisines } from '../../../config/mdb';

export const getListOfCuisines = async () => {
  try {
    return await Cuisines.find();
  } catch (error: any) {
    return new Error(error);
  }
};

export const getListOfCuisinesFiltered = async (filter: string): Promise<ICuisine[]> => {
  try {
    if (filter)
      return await Cuisines.find({
        $or: [
          { code: { $regex: filter.toLowerCase() } },
          { name: { $regex: filter.toLowerCase() } },
          { oryginalName: { $regex: filter.toLowerCase() } },
        ],
      });
    else return [];
  } catch (error: any) {
    return [];
  }
};
