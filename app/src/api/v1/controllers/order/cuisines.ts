import { getListOfCuisinesFiltered } from '../../helpers/Cuisines/getListOfAllCuisines';
import { Request, Response } from 'express';
import { getListOfCuisines } from '../../helpers/Cuisines/getListOfAllCuisines';
import { IResponse } from '../../interfaces';

const allCuisines = async (req: Request, res: IResponse) => {
  try {
    const allCuisines = await getListOfCuisines();
    res.status(200).send({ message: 'succesfully get all cuisines', data: allCuisines, error: null });
  } catch (error) {
    console.error(error);
    res.status(401).send({ message: 'failed to load all cuisines', data: null, error: error });
  }
};

const allCuisinesFiltered = async (req: Request, res: IResponse) => {
  const cuisine = req.params.cuisine;
  try {
    const allCuisines = await getListOfCuisinesFiltered(cuisine);
    res.status(200).send({ message: 'succesfully get all cuisines', data: allCuisines, error: null });
  } catch (error) {
    console.error(error);
    res.status(401).send({ message: 'failed to load all cuisines', data: null, error: error });
  }
};

export default {
  allCuisines,
  allCuisinesFiltered,
};
