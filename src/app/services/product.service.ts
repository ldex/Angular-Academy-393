import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  delay,
  shareReplay,
  tap,
  first,
  map,
  mergeAll,
  BehaviorSubject,
  switchMap,
  of,
  filter,
} from 'rxjs';
import { Product } from '../products/product.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl: string = `${environment.apiUrl}/products`;
  products$: Observable<Product[]>;

  constructor(private http: HttpClient) {
    this.initProducts();
  }

  initProducts() {
    const params = {
      _sort: 'modifiedDate',
      _order: 'desc',
    };

    const options = {
      params: params,
    };

    this.products$ = this.http
      .get<Product[]>(this.baseUrl, options)
      .pipe(
        delay(1500), // for the demo...
        //tap(console.table),
        shareReplay()
      );
  }

  insertProduct(newProduct: Product): Observable<Product> {
    newProduct.modifiedDate = new Date();
    return this.http.post<Product>(this.baseUrl, newProduct).pipe(delay(2000));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + '/' + id);
  }

  resetList() {
    this.initProducts();
  }
}
