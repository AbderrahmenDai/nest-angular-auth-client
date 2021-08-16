import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
  catchError,
  filter,
  mergeMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { MainSocket } from '../../../../core/socket/main-socket';
import { User } from '../../../auth/service/auth.service';
import { UserService } from '../../../user/service/user.service';
import { MessageType } from '../../components/messages/messages.component';

@Component({
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss'],
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  MessageType = MessageType;
  updateMessages$ = new Subject();
  messages: Message[] = [];
  destroy$ = new Subject();
  toName: string;
  to: User;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        mergeMap(params => {
          this.toName = params.username;

          return this.userService.getUser(this.toName);
        }),
        take(1),
        catchError(() => this.router.navigate(['/'])),
        filter<User>(user => typeof user !== 'boolean'),
        tap(user => (this.to = user)),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}