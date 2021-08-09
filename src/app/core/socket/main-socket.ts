import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'src/app/features/auth/service/auth.service';
import { environment } from '../../../environments/environment';

const getOptions = (authService: AuthService) => ({
  transportOptions: {
    polling: {
      extraHeaders: {
        Authorization: `Bearer ${authService.getAccessToken()}`,
      },
    },
  },
  autoConnect: false,
});

@Injectable()
export class MainSocket extends Socket {
  constructor(private authService: AuthService) {
    super({
      url: environment.socket,
      options: getOptions(authService),
    });

    this.ioSocket.on('connect', () => {});
  }

  connect() {
    Object.assign(this.ioSocket?.io?.opts || {}, getOptions(this.authService));

    super.connect();
  }
}
