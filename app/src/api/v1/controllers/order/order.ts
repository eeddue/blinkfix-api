import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import {
  Address,
  Establishment,
  EstablishmentMenu,
  EstablishmentMenuItems,
  EstablishmentMenuItemsIngredients,
  Job,
  Order,
  User,
} from '../../../config/mdb';
import { IResponse } from '../../interfaces';
import { IEstablishment } from '../../interfaces/mongo/establishment';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { IAddress } from '../../models/Order';
import { IOrder, IOrderItems, IOrderRequest } from '../../models/Order/order';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

// TODO: refactor this code
const UserAddOrder = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;

  const { orderWhere, orderItems, address, isPickup, isWaiter }: IOrderRequest = req.body;
  try {
    if (!orderWhere || !orderItems) {
      throw new Error('bad request');
    } else {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('user not found');
      } else {
        const orderEstablishment = await Establishment.findById(orderWhere);
        if (!orderEstablishment) {
          throw new Error('establishment not found');
        }

        if (address) {
          const addressCheck = await Address.findOne({
            country: address.country,
            city: address.city,
            street: address.street,
            postcode: address.postcode,
            state: address.state,
            buildingnumber: address.buildingnumber,
          });

          if (!addressCheck) {
            const newAddress = await Address.create(address);
            await User.findByIdAndUpdate(id, { $push: { address: newAddress._id } });
          }

          const findAddress = await Address.findOne({
            country: address.country,
            city: address.city,
            street: address.street,
            postcode: address.postcode,
            state: address.state,
            buildingnumber: address.buildingnumber,
          });

          if (findAddress) {
            const itemIds = await CheckIfEstablishmentContainsItems({ orderItems, orderWhere });
            await CheckIfItemsContainsIngredients(orderItems, itemIds.itemIds);

            //ingredient prices
            const ingredientIds = await Promise.all(
              orderItems
                .flatMap((item) =>
                  item.changes
                    ?.map(async (change) => {
                      const ingredientsFromDb = await EstablishmentMenuItemsIngredients.findOne({
                        _id: change.ingredientId,
                      });
                      return { ingredientPrice: ingredientsFromDb?.pricePerIngredient, qtt: change.qtt };
                    })
                    .flat(),
                )
                .filter((info) => info !== undefined),
            );

            const ingredientsPrice = ingredientIds.reduce(
              (partialSum, a) => partialSum + (a?.ingredientPrice ? a.qtt * a.ingredientPrice : 0),
              0,
            );

            // items price
            const menuItemsPricesFromDb: number[] = await Promise.all(
              orderItems
                .map(async (item) => {
                  const itemFromDb = await EstablishmentMenuItems.findOne({ _id: item.itemId });
                  return itemFromDb ? itemFromDb.price : 0;
                  //
                })
                .filter((final) => final !== undefined),
            );

            const totalItemPrices = menuItemsPricesFromDb?.reduce((partialSum, a) => partialSum + a, 0);

            const totalOrderPrice = ingredientsPrice + totalItemPrices;

            const datenow = new Date();
            const newOrder = await Order.create({
              orderWhere: orderEstablishment?._id,
              orderBy: user._id,
              address: address ? findAddress._id : user.address[0],
              orderDate: new Date(),
              updateDate: new Date(),
              isPickup: false,
              forwardedTo: 'chef',
            });
            if (isWaiter) {
              const userJob = await Job.findOne({ workerId: id, typeOfWork: 'waiter' });
              if (!userJob) throw new Error('missing job file. Try to log in again.');

              await Order.findByIdAndUpdate(newOrder._id, {
                assignedTo: isWaiter ? userJob._id : undefined,
                allAssignedTo: isWaiter ? [userJob._id] : undefined,

                orderStatus: 'took by waiter',
              });
              await userJob?.updateOne({ $addToSet: { orders: newOrder._id } });
            }

            if (newOrder && orderItems.length > 0) {
              const orderItemsOrder = await Order.findByIdAndUpdate(
                newOrder._id,
                { orderItems: orderItems, totalAmount: totalOrderPrice },
                { new: true, runValidators: true },
              )
                .populate({
                  path: 'orderItems',
                  populate: {
                    path: 'itemId',
                    model: 'EstablishmentMenuItems',
                    populate: {
                      path: 'dishIngredients',
                      model: 'EstablishmentMenuItemsIngredients',
                    },
                  },
                })
                .populate({
                  path: 'orderItems',
                  populate: {
                    path: 'itemId',
                    model: 'EstablishmentMenuItems',
                    populate: {
                      path: 'image',
                    },
                  },
                })
                .populate({
                  path: 'orderItems',
                  populate: {
                    path: 'changes',
                    populate: {
                      path: 'ingredientId',
                      model: 'EstablishmentMenuItemsIngredients',
                    },
                  },
                })
                .populate('address')
                .exec();

              return res.status(200).send({
                data: orderItemsOrder,
                message: 'order placed successfully',
                error: null,
              });
            } else {
              await Order.findByIdAndDelete(newOrder?._id);
              throw new Error('orderItems not found');
            }

            //#region menu items

            //check if establishment have this order item

            //#endregion
          } else {
            throw new Error('Bad request');
          }
        } else {
          console.log('waiter');
          const itemIds = await CheckIfEstablishmentContainsItems({ orderItems, orderWhere });
          // TODO: check this shit
          await CheckIfItemsContainsIngredients(orderItems, itemIds.itemIds);

          //ingredient prices
          const ingredientIds = await Promise.all(
            orderItems
              .flatMap((item) =>
                item.changes
                  ?.map(async (change) => {
                    const ingredientsFromDb = await EstablishmentMenuItemsIngredients.findOne({
                      _id: change.ingredientId,
                    });
                    return { ingredientPrice: ingredientsFromDb?.pricePerIngredient, qtt: change.qtt };
                  })
                  .flat(),
              )
              .filter((info) => info !== undefined),
          );

          const ingredientsPrice = ingredientIds.reduce(
            (partialSum, a) => partialSum + (a?.ingredientPrice ? a.qtt * a.ingredientPrice : 0),
            0,
          );

          // items price
          const menuItemsPricesFromDb: number[] = await Promise.all(
            orderItems
              .map(async (item) => {
                const itemFromDb = await EstablishmentMenuItems.findOne({ _id: item.itemId });
                return itemFromDb ? itemFromDb.price : 0;
                //
              })
              .filter((final) => final !== undefined),
          );

          const totalItemPrices = menuItemsPricesFromDb?.reduce((partialSum, a) => partialSum + a, 0);

          const totalOrderPrice = ingredientsPrice + totalItemPrices;

          const datenow = new Date();
          const newOrder = await Order.create({
            orderWhere: orderEstablishment?._id,
            orderBy: user._id,
            address: null,
            orderDate: datenow,
            updateDate: datenow,
            isPickup: true,
            forwardedTo: 'chef',
          });
          if (isWaiter) {
            const userJob = await Job.findOne({ workerId: id, typeOfWork: 'waiter' });
            if (!userJob) throw new Error('missing job file. Try to log in again.');

            await Order.findByIdAndUpdate(newOrder._id, {
              assignedTo: isWaiter ? userJob._id : undefined,
              allAssignedTo: isWaiter ? [userJob._id] : undefined,
              orderStatus: 'took by waiter',
            });
            await userJob?.updateOne({ $addToSet: { orders: newOrder._id } });
          }

          if (newOrder && orderItems.length > 0) {
            const orderItemsOrder = await Order.findByIdAndUpdate(
              newOrder._id,
              { orderItems: orderItems, totalAmount: totalOrderPrice, updateDate: new Date() },
              { new: true, runValidators: true },
            )
              .populate([
                {
                  path: 'orderItems',
                  populate: {
                    path: 'itemId',
                    model: 'EstablishmentMenuItems',
                    populate: {
                      path: 'dishIngredients',
                      model: 'EstablishmentMenuItemsIngredients',
                    },
                  },
                },
              ])
              .populate({
                path: 'orderItems',
                populate: {
                  path: 'itemId',
                  model: 'EstablishmentMenuItems',
                  populate: {
                    path: 'image',
                  },
                },
              })
              .populate({
                path: 'orderItems',
                populate: {
                  path: 'changes',
                  populate: {
                    path: 'ingredientId',
                    model: 'EstablishmentMenuItemsIngredients',
                  },
                },
              })
              .populate('address')
              .exec();

            if (isWaiter) {
              const userJob = await Job.findOne({ workerId: id, typeOfWork: 'waiter' });
              if (!userJob) throw new Error('missing job file. Try to log in again.');

              await userJob?.updateOne({ $addToSet: { orders: newOrder._id } });
            }
            return res.status(200).send({
              data: orderItemsOrder,
              message: 'order placed successfully',
              error: null,
            });
          } else {
            await Order.findByIdAndDelete(newOrder?._id);
            throw new Error('orderItems not found');
          }

          //#region menu items

          //check if establishment have this order item

          //#endregion
        }
      }
    }
  } catch (error: any) {
    console.error(error.message);
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const UpdateOrderState = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const orderId = req.params.orderId;
  const newStateString = req.body.newStateString;
  try {
    if (typeof id === 'string') {
      console.log(id);
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).send({ data: null, message: 'bad request', error: null });
      } else {
        const order = await Order.findById(orderId)
          .populate({
            path: 'orderItems',
            populate: {
              path: 'itemId',
              model: 'EstablishmentMenuItems',
              populate: {
                path: 'dishIngredients',
                model: 'EstablishmentMenuItemsIngredients',
              },
            },
          })
          .populate({
            path: 'orderItems',
            populate: {
              path: 'changes',
              populate: {
                path: 'ingredientId',
                model: 'EstablishmentMenuItemsIngredients',
              },
            },
          })
          .exec();
        if (!newStateString) {
          return res.status(400).send({ data: null, message: 'newStateString Not set', error: null });
        }
        if (newStateString === 'paid') {
          return res.status(400).send({
            data: null,
            message: 'you are nont allowd to proceed this action',
            error: null,
          });
        }
        if (!order) {
          return res.status(404).send({ data: null, message: 'order Not Found', error: null });
        } else {
          if (order.orderBy.toString() !== id) {
            return res.status(400).send({ data: null, message: 'you cannot cancel this order', error: null });
          }
          if (order.orderStatus === 'canceled') {
            return res.status(400).send({ data: null, message: 'this order is already canceled', error: null });
          }
          const updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            {
              orderStatus: newStateString,
              updateDate: new Date(),
            },
            { new: true, runValidators: true },
          );
          return res.status(200).send({
            data: updatedOrder,
            message: `order ${order._id} is now ` + newStateString,
            error: null,
          });
        }
      }
    } else {
      return res.status(400).send({ data: null, message: 'bad request', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const EditOrderAddNewOrderItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const orderItem: IOrderItems = req.body.orderItem;
  const orderId = req.params.orderId;
  try {
    const order = await Order.findOne({ _id: orderId, orderBy: id });

    if (!order) {
      return res.status(400).send({ data: null, message: `order ${orderId} not found`, error: null });
    }
    if (!orderItem) {
      if (!order) {
        return res.status(400).send({ data: null, message: `order item not found`, error: null });
      }
    }
    const orderItems = [orderItem];
    const ids = await CheckIfEstablishmentContainsItems({ orderItems, orderWhere: order?.orderWhere });

    await CheckIfItemsContainsIngredients(orderItems, ids.itemIds);

    if (order && orderItems.length > 0) {
      const updatedOrder = await Order.findByIdAndUpdate(
        order?._id,
        {
          updateDate: new Date(),

          $push: { orderItems: orderItem },
        },
        { new: true, runValidators: true },
      );

      return res.status(200).send({ data: updatedOrder, message: 'item added succesfully', error: null });
    } else {
      return res.status(400).send({ data: null, message: 'bad request', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const EditOrderDeleteOrderItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const { orderId, itemId } = req.params;

  try {
    const order = await Order.findOne({ _id: orderId, orderBy: id });

    if (!order) {
      return res.status(400).send({ data: null, message: `order ${orderId} not found`, error: null });
    }
    if (order) {
      await Order.findOneAndUpdate(
        { _id: orderId, 'orderItems._id': itemId, updateDate: new Date() },
        {
          $pull: {
            orderItems: {
              _id: itemId,
            },
          },
        },
      )
        .populate({
          path: 'orderItems',
          populate: {
            path: 'itemId',
            model: 'EstablishmentMenuItems',
            populate: {
              path: 'dishIngredients',
              model: 'EstablishmentMenuItemsIngredients',
            },
          },
        })
        .populate({
          path: 'orderItems',
          populate: {
            path: 'changes',
            populate: {
              path: 'ingredientId',
              model: 'EstablishmentMenuItemsIngredients',
            },
          },
        })
        .exec();

      const updatedOrder = await Order.findOne({ _id: orderId });

      return res.status(200).send({ data: updatedOrder, message: 'item deleted succesfully', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const EditOrderEditOrderItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const orderItem: IOrderItems = req.body.orderItem;
  const { orderId, itemId } = req.params;
  try {
    const order = await Order.findOne({ _id: orderId, orderBy: id });

    if (!order) {
      return res.status(400).send({ data: null, message: `order ${orderId} not found`, error: null });
    }
    if (!orderItem) {
      if (!order) {
        return res.status(400).send({ data: null, message: `order item not found`, error: null });
      }
    }
    const orderItems = [orderItem];
    const ids = await CheckIfEstablishmentContainsItems({ orderItems, orderWhere: order?.orderWhere });

    await CheckIfItemsContainsIngredients(orderItems, ids.itemIds);

    if (order && orderItems.length > 0) {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, 'orderItems._id': itemId, updateDate: new Date() },

        {
          $set: {
            'orderItems.$.changes': orderItem.changes,
          },
        },
        { new: true, runValidators: true },
      )
        .populate({
          path: 'orderItems',
          populate: {
            path: 'itemId',
            model: 'EstablishmentMenuItems',
            populate: {
              path: 'dishIngredients',
              model: 'EstablishmentMenuItemsIngredients',
            },
          },
        })
        .populate({
          path: 'orderItems',
          populate: {
            path: 'changes',
            populate: {
              path: 'ingredientId',
              model: 'EstablishmentMenuItemsIngredients',
            },
          },
        })
        .exec();

      return res.status(200).send({ data: updatedOrder, message: 'item added succesfully', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const UpdateOrderStateCancel = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const orderId = req.params.orderId;
  try {
    if (typeof id === 'string') {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).send({ data: null, message: 'bad request', error: null });
      } else {
        const userRole = user.userRole;
        const order = await Order.findById(orderId)
          .populate({
            path: 'orderItems',
            populate: {
              path: 'itemId',
              model: 'EstablishmentMenuItems',
              populate: {
                path: 'dishIngredients',
                model: 'EstablishmentMenuItemsIngredients',
              },
            },
          })
          .populate({
            path: 'orderItems',
            populate: {
              path: 'changes',
              populate: {
                path: 'ingredientId',
                model: 'EstablishmentMenuItemsIngredients',
              },
            },
          })
          .exec();

        if (!order) {
          return res.status(404).send({ data: null, message: 'order Not Found', error: null });
        } else {
          if (order.orderBy.toString() !== id) {
            return res.status(400).send({ data: null, message: 'you cannot cancel this order', error: null });
          }
          if (order.orderStatus === 'canceled') {
            return res.status(400).send({ data: null, message: 'this order is already canceled', error: null });
          }
          const updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            {
              orderStatus: 'canceled',
              updateDate: new Date(),
            },
            { new: true, runValidators: true },
          );
          return res.status(200).send({ data: updatedOrder, message: 'sucesfully canceled order', error: null });
        }
      }
    } else {
      return res.status(400).send({ data: null, message: 'bad request', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

async function CheckIfEstablishmentContainsItems({
  orderItems,
  orderWhere,
}: {
  orderItems: IOrderItems[];
  orderWhere: Types.ObjectId;
}) {
  try {
    const itemIds = orderItems.map((item) => {
      return item.itemId;
    });

    const menuWithItemIds = await EstablishmentMenu.findOne().where('menuItems').in(itemIds).exec();
    if (!menuWithItemIds) {
      throw new Error('not found menu with this items');
    } else {
      if (orderWhere.toString() !== menuWithItemIds.establishmentId.toString()) {
        throw new Error('Establishment not match with one from request');
      }
      return { itemIds, menuWithItemIds };
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function CheckIfItemsContainsIngredients(orderItems: IOrderItems[], itemIds: Types.ObjectId[]) {
  try {
    const itemsFromDb = await EstablishmentMenuItems.find().where('_id').in(itemIds);

    const ingredientsFromDb = itemsFromDb
      .map((menuitem) => menuitem.dishIngredients)
      .map((i) => i.map((x) => x))
      .flat();

    const orderItemsIngredientsId = orderItems
      .map((orderItem) => {
        return orderItem.changes;
      })
      .flat()
      .map((orderList) => orderList?.ingredientId);

    if (!ingredientsFromDb) {
      throw new Error('No items found');
    } else {
      const test = orderItemsIngredientsId.map((id) => {
        if (id) {
          const bools = ingredientsFromDb.map((item) => {
            return item.toString() === id.toString();
          });

          if (!bools || !bools.includes(true)) {
            throw new Error(' ingredient not found');
          }
          return bools;
        }
      });
      return { orderItemsIngredientsId, ingredientsFromDb, test };
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
}

const GetOrdersToConfirm = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const { orderWhere } = req.params;
  try {
    const establishment = await Establishment.findById(orderWhere);
    if (!establishment) {
      return res.status(404).send({ data: null, message: 'establishment not found', error: null });
    }

    //TODO: check if work there
    if (establishment?.owner.toString() !== id) {
      return res.status(400).send({
        data: null,
        message: 'you are nont allowd to proceed this action',
        error: null,
      });
    }
    const OrdersToConfirm = await Order.find({
      orderStatus: 'paid',
      orderWhere: orderWhere,
    });

    return res.status(200).send({ data: OrdersToConfirm, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetMyOrders = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({
        data: null,
        message: 'you are nont allowd to proceed this action',
        error: null,
      });
    }
    const userOrders = await Order.find({
      orderBy: user?.id,
    })
      .populate('address')
      .populate({
        path: 'orderWhere',
        populate: {
          path: 'owner',
          populate: { path: 'images.profileImage', model: 'ProfileImage' },
        },
      })
      .populate({
        path: 'orderItems',
        populate: { path: 'itemId', model: 'EstablishmentMenuItems' },
      })
      .populate({
        path: 'orderItems',
        populate: { path: 'changes', populate: { path: 'ingredientId' } },
      });

    return res.status(200).send({ data: userOrders, message: 'user orders found successfully', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

console.log('updateTime: ' + new Date().toTimeString());
const GetEstablishmentOrders = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      throw new Error('token not exist');
    }
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;
    if (typeof id !== 'string') {
      throw new Error('bad request');
    }
    const mongooseOwnerId = new mongoose.Types.ObjectId(id);
    const establishments = await Establishment.find({ owner: mongooseOwnerId });

    if (establishments.length === 0) {
      throw new Error('you do not have any establishment');
    }
    const establishmentsIds = establishments.map((establishment) => establishment._id);

    const orders = await Order.find({
      orderWhere: { $in: establishmentsIds },
    }).populate([
      { path: 'orderBy' },
      { path: 'orderWhere' },
      { path: 'address' },
      { path: 'assignedTo', populate: { path: 'workerId' } },
      { path: 'allAssignedTo', populate: { path: 'workerId' } },
      {
        path: 'orderItems',
        populate: [
          {
            path: 'itemId',
            model: 'EstablishmentMenuItems',
            populate: [
              {
                path: 'dishIngredients',
                model: 'EstablishmentMenuItemsIngredients',
              },
              {
                path: 'image',
              },
              {
                path: 'counter',
              },
              {
                path: 'allergens',
              },
            ],
          },
          {
            path: 'changes',
            populate: {
              path: 'ingredientId',
              model: 'EstablishmentMenuItemsIngredients',
            },
          },
        ],
      },
    ]);
    interface IGroupedOrders {
      [key: string]: {
        establishment: string | null;
        orders: IOrder[];
      };
    }

    const groupedOrders: IGroupedOrders = orders.reduce((acc: IGroupedOrders, order) => {
      const orderWhere = order.orderWhere._id.toString();

      if (!acc[orderWhere]) {
        acc[orderWhere] = {
          establishment: null,
          orders: [],
        };
      }
      acc[orderWhere].orders.push(order);
      return acc;
    }, {});

    const establishmentsWithOrders = Object.entries(groupedOrders).map(([orderWhere, data]) => {
      return {
        // @ts-ignore
        establishment: orderWhere,
        orders: data.orders,
      };
    });

    return res
      .status(200)
      .send({ data: establishmentsWithOrders, message: 'user orders found successfully', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetEstablishmentBestSellers = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const establishmentId = req.params.establishmentId;
  try {
    const establishment = await Establishment.findById(establishmentId);
    if (!establishment) {
      return res.status(404).send({ data: null, message: 'establishment not found', error: null });
    }

    const topOrders = await getTopOrders(establishmentId);

    return res.status(200).send({ data: topOrders, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

export default {
  UserAddOrder,
  UpdateOrderStateCancel,
  UpdateOrderState,
  GetOrdersToConfirm,
  EditOrderAddNewOrderItem,
  EditOrderEditOrderItem,
  EditOrderDeleteOrderItem,
  GetMyOrders,
  GetEstablishmentOrders,
  GetEstablishmentBestSellers,
};

async function getTopOrders(establishmentId: string) {
  const establishment = await Establishment.findById(establishmentId);
  if (!establishment) throw new Error('estrablishment not found.');

  const grouped = await Order.aggregate([
    { $unwind: '$orderItems' },
    { $group: { _id: '$orderItems.itemId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const result = await Order.populate(grouped, {
    path: '_id',
    model: 'EstablishmentMenuItems',
    populate: { path: 'dishIngredients', model: 'EstablishmentMenuItemsIngredients' },
  });
  return result;
}
