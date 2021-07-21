import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SocialLoginModule,
} from 'angularx-social-login';
import { environment } from 'src/environments/environment';

const apps = environment.apps;

@NgModule({
  declarations: [],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(apps.google),
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider(apps.facebook),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
  imports: [CommonModule, SocialLoginModule],
  exports: [SocialLoginModule],
})
export class AuthModule {}
