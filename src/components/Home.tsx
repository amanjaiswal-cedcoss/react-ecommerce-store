import { ChangeEvent } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import {
  addProductToCart,
  increaseQuantityInCart,
  updateFilteredProducts,
  updateFiltersUsed,
} from "../redux/ecomSlice";
import { AppDispatch, RootState } from "../redux/store";
import { filterKeysType, filtersUsedType } from "../types";
import noResultsFound from "../assets/no-results-found.jpg";
import loader from "../assets/loading.gif";

function Home() {
  const dispatch: AppDispatch = useDispatch();
  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
  const ecomState = useAppSelector((store) => store.ecom);

  const addToCart = (id: number) => {
    if (ecomState.user.email === "") {
      alert("Sign In to add products to cart");
    } else {
      let found = false;
      ecomState.user.cart.forEach((ele, i) => {
        if (ele.id === id) {
          found = true;
          if(ele.quantity<ele.stock){
            if (ele.quantity < 10) {
              dispatch(increaseQuantityInCart(i));
            } else {
              alert("Maximum quantity per order for a product is 10");
            }
          }
          else{
            alert(`Current stock of this product is ${ele.stock}`);
          }
        }
      });
      if (!found) {
        let productIndex = ecomState.products.findIndex((ele) => ele.id === id);
        if (productIndex !== -1) {
          let product = { ...ecomState.products[productIndex], quantity: 1 };
          dispatch(addProductToCart(product));
        }
      }
    }
  };

  const filterProducts = (
    e: ChangeEvent<HTMLInputElement>,
    filterName: filterKeysType,
    filterValue: string,
    lessThan: number = 0,
    greaterThan: number = 0
  ) => {
    let filterObj: filtersUsedType = JSON.parse(
      JSON.stringify(ecomState.filtersUsed)
    );
    let isChecked = e.currentTarget.checked;
    if (isChecked) {
      if (filterName === "brand" || filterName === "category") {
        filterObj[filterName].push(filterValue);
      } else if (
        filterName === "price" ||
        filterName === "discountPercentage"
      ) {
        filterObj[filterName].push({ minimum: greaterThan, maximum: lessThan });
      }
    } else {
      let deleteIndex = -1;
      if (filterName === "brand" || filterName === "category") {
        deleteIndex = filterObj[filterName].indexOf(filterValue);
      } else if (
        filterName === "price" ||
        filterName === "discountPercentage"
      ) {
        deleteIndex = filterObj[filterName].findIndex(
          (ele: any) => ele.minimum === greaterThan && ele.maximum === lessThan
        );
      }
      deleteIndex >= 0 && filterObj[filterName].splice(deleteIndex, 1);
    }

    dispatch(updateFiltersUsed(filterObj));

    let filteredProducts = ecomState.products.filter((ele) => {
      return (
        (filterObj.brand.length === 0 || filterObj.brand.includes(ele.brand)) &&
        (filterObj.category.length === 0 ||
          filterObj.category.includes(ele.category)) &&
        (filterObj.price.find(
          (item) => item.minimum < ele.price && item.maximum > ele.price
        ) ||
          filterObj.price.length === 0) &&
        (filterObj.discountPercentage.find(
          (item) =>
            item.minimum < ele.discountPercentage &&
            item.maximum > ele.discountPercentage
        ) ||
          filterObj.discountPercentage.length === 0)
      );
    });
    dispatch(updateFilteredProducts(filteredProducts));
  };

  const search = (e: ChangeEvent<HTMLInputElement>) => {
    let searched = e.currentTarget.value;
    let results = ecomState.products.filter((ele) => {
      return (
        ele.brand.toLowerCase().search(searched.toLowerCase()) !== -1 ||
        ele.category.toLowerCase().search(searched.toLowerCase()) !== -1 ||
        ele.title.toLowerCase().search(searched.toLowerCase()) !== -1
      );
    });
    dispatch(updateFilteredProducts(results));
  };

  const sort = (e: ChangeEvent<HTMLSelectElement>) => {
    let value = e.currentTarget.value;
    let property = value.slice(0, value.indexOf("-"));
    let sortOrder = value.slice(value.indexOf("-") + 1);
    let results = [...ecomState.products];
    if (sortOrder === "ascending") {
      results.sort((a, b) => a[property] - b[property]);
    } else if (sortOrder === "descending") {
      results.sort((a, b) => b[property] - a[property]);
    }
    dispatch(updateFilteredProducts(results));
  };

  return (
    <main className="home d-flex align-items-start position-relative">
      <aside className="home__filters bg-white p-4">
        <h4 className="fw-light">FILTERS</h4>
        {ecomState.filters.map((ele) => {
          return (
            <ul className="home__filterlists" key={ele.name}>
              <li className="text-uppercase fw-bold">{ele.name}</li>
              {ele.type === "string"
                ? ele.stringValue!.map((listItem) => {
                    return (
                      <li key={listItem}>
                        <input
                          className="mx-2"
                          onChange={(e) => {
                            filterProducts(e, ele.name, listItem);
                          }}
                          type="checkbox"
                        />
                        {listItem}
                      </li>
                    );
                  })
                : ele.numericValue!.map((listItem) => {
                    return (
                      <li key={listItem.value}>
                        <input
                          className="mx-2"
                          onChange={(e) => {
                            filterProducts(
                              e,
                              ele.name,
                              "",
                              listItem.lessThan,
                              listItem.greaterThan
                            );
                          }}
                          type="checkbox"
                        />
                        {listItem.value}
                      </li>
                    );
                  })}
            </ul>
          );
        })}
      </aside>
      <section className="productsarea flex-grow-1 px-3">
        <div className="productsarea__searchsort my-4 d-flex gap-2 align-items-center">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0 rounded-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 p-2 rounded-0"
              placeholder="Search for products, brands and more."
              onChange={(e) => search(e)}
            />
          </div>
          <select
            className="form-select rounded-0 py-2 shadow-sm"
            onChange={(e) => {
              sort(e);
            }}
          >
            <option hidden>Sort By</option>
            <option value="price-descending">Price:High to Low</option>
            <option value="price-ascending">Price:Low to High</option>
            <option value="rating-descending">Rating:High to Low</option>
            <option value="rating-ascending">Rating:Low to High</option>
            <option value="discountPercentage-descending">
              Discount:High to Low
            </option>
            <option value="discountPercentage-ascending">
              Discount:Low to High
            </option>
          </select>
        </div>
        {ecomState.loading ? (
          <span className="fs-4 d-flex justify-content-center gap-1">
            <span>Loading</span>
            <img className="loader" src={loader} alt="loading gif" />
          </span>
        ) : ecomState.filteredProducts.length > 0 ? (
          <section className="products my-2">
            {ecomState.filteredProducts.map((ele) => {
              return (
                <div
                  key={ele.id}
                  className="product d-flex flex-column align-items-center border rounded-2 "
                >
                  <img
                    className="product__pic"
                    src={ele.thumbnail}
                    alt={ele.title}
                  />
                  <span className="product__rating shorttxt fw-bold bg-white px-1 rounded-1">
                    {ele.rating}
                    <i className="bi bi-star-fill ms-1"></i>
                  </span>
                  <div className="product__details card-body w-100 d-flex gap-2 flex-column justify-content-between">
                    <h6 className="product__details__title my-1">
                      {ele.title}
                    </h6>
                    <span className="shorttxt">by {ele.brand}</span>
                    <div className="product__details__price d-flex gap-1 align-items-center">
                      <span className="fw-bold">₹{ele.price}</span>
                      <span className="text-seconday text-decoration-line-through shorttxt">
                        ₹
                        {(
                          (ele.price * 100) /
                          (100 - ele.discountPercentage)
                        ).toFixed()}
                      </span>
                      <span className="shorttxt text-danger">
                        ({ele.discountPercentage.toFixed()}% OFF)
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(ele.id)}
                      className="product__btncta border-0 py-2 shorttxt"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <div className="bg-white text-center vh-100">
            <img className="my-4" src={noResultsFound} alt="no results pic" />
            <h4>Sorry! No results found :(</h4>
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
