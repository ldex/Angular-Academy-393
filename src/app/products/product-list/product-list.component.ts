import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, EMPTY, combineLatest, Subscription, tap, catchError, startWith, count, map, debounceTime, filter, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

import { Product } from '../product.interface';
import { ProductService } from '../../services/product.service';
import { FavouriteService } from '../../services/favourite.service';
import { LoadingService } from 'src/app/services/loading.service';
import { log, logWithPrefix } from 'src/app/log.operator';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  title: string = 'Products';
  selectedProduct: Product;

  products$: Observable<Product[]>;
  productsNumber$: Observable<number>;
  filter$: Observable<string>;
  filtered$: Observable<boolean>;
  filteredProducts$: Observable<Product[]>;

  errorMessage;

  filter: FormControl<string> = new FormControl("");

  favouriteAdded$: Observable<Product>;

  constructor(
    private loadingService: LoadingService,
    private productService: ProductService,
    private favouriteService: FavouriteService,
    private router: Router) {

      this.favouriteAdded$ = this
                              .favouriteService
                              .favouriteAdded$
                              .pipe(
                                tap(console.log),
                                takeUntilDestroyed()
                              )
                              // .subscribe(
                              //   product => this.favouriteAdded = product
                              // )

  }

  ngOnInit(): void {


    this.products$ = this
                      .productService
                      .products$
                      .pipe(
                        logWithPrefix('Data: '),
                        catchError(
                          error => {
                            this.errorMessage = error;
                            return EMPTY;
                          }
                        )
                      );

    this.loadingService.showLoaderUntilCompleted(this.products$);

    this.filter$ = this
                    .filter
                    .valueChanges
                    .pipe(
                      map(text => text.trim()),
                      filter(text => text == '' || text.length > 2),
                      debounceTime(500),
                      distinctUntilChanged(),
                      tap(() => this.firstPage()),
                      startWith("")
                    )

      this.filtered$ = this
                          .filter$
                          .pipe(
                            map(text => text.length > 0)
                          )

      this.filteredProducts$ = combineLatest([this.products$, this.filter$])
        .pipe(
          map(([products, filterString]) =>
            products.filter(product =>
              product.name.toLowerCase().includes(filterString.toLowerCase())
            )
          )
        )

      this.productsNumber$ = this
        .filteredProducts$
        .pipe(
          map(products => products.length),
          startWith(0)
        )

  }

  get favourites(): number {
    return this.favouriteService.getFavouritesNb();
  }

  // Pagination
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;

  firstPage() {
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 1;
  }

  previousPage() {
    this.start -= this.pageSize;
    this.end -= this.pageSize;
    this.currentPage--;
    this.selectedProduct = null;
  }

  nextPage() {
    this.start += this.pageSize;
    this.end += this.pageSize;
    this.currentPage++;
    this.selectedProduct = null;
  }

  onSelect(product: Product) {
    this.selectedProduct = product;
    this.router.navigateByUrl('/products/' + product.id);
  }

  reset() {
    this.productService.resetList();
    this.router.navigateByUrl('/products'); // self navigation to force data update
  }

  resetPagination() {
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 1;
  }
}
