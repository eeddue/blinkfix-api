const establishmentCategoryValidation = (
  establishmentType: 'shop' | 'restaurant' | 'foodtruck' | 'localCook' | undefined,
  establishmentCategory: string,
) => {
  const restaurantCategories = [
    'bakeries',
    'starters',
    'sides',
    'soups',
    'mains',
    'desserts',
    'beverages',
    'alc beverages',
    'products',
    'bulk',
  ];
  const shopCategories = [
    'dairy',
    'meat',
    'poultry',
    'vegetables',
    'fruits',
    'bakery',
    'frozen',
    'alcoholic',
    'beverages',
    'snacks',
    'pickles',
    'tobacco products',
    'bulk',
  ];
  if (!establishmentType) {
    return false;
  }

  if (establishmentType === 'shop') {
    if (!shopCategories.includes(establishmentCategory)) {
      return false;
    } else {
      return true;
    }
  } else {
    if (!restaurantCategories.includes(establishmentCategory)) {
      return false;
    } else {
      return true;
    }
  }
};

export default establishmentCategoryValidation;
