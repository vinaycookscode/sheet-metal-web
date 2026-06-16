import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { BlockerService } from './blocker.service';

/**
 * Attach the bearer token; on 401 (outside /auth) drop the session; and surface any
 * structured business-rule blocker ({ blocked, code, message, action }) as an app-wide
 * banner instead of leaving each page to render a raw error.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const blocker = inject(BlockerService);
  const token = auth.getToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) auth.logout();
      const body = err.error;
      if (body && typeof body === 'object' && body.blocked === true && typeof body.message === 'string') {
        blocker.show({ code: body.code, message: body.message, action: body.action });
      }
      return throwError(() => err);
    }),
  );
};
