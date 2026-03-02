import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Shape returned by controllers that want a success message. */
export interface MessagePayload<T> {
  _message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        // If the controller returned a MessagePayload, unwrap it.
        if (
          payload !== null &&
          typeof payload === 'object' &&
          '_message' in payload
        ) {
          const { _message, data } = payload as MessagePayload<T>;
          return { success: true, message: _message, data };
        }
        return { success: true, data: payload as T };
      }),
    );
  }
}
