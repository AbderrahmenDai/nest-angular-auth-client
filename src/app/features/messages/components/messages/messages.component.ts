import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { boundMethod } from 'autobind-decorator';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Sound, SoundService } from 'src/app/shared/services/sound.service';
import { HttpError } from '../../../../core/interceptor/error-handler.interceptor';
import { MainSocket } from '../../../../core/socket/main-socket';
import { AuthService, User } from '../../../auth/service/auth.service';
import { Room } from '../../../room/service/room.service';
import { Message, MessageService } from '../../service/message.service';

export enum MessageType {
  Direct = 'direct',
  Room = 'room',
}

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  @Input() type: MessageType;
  @Input() room?: Room;
  @Input() to?: User;
  @Input() updateMessagesSubject: Subject<void>;

  messageForm = this.formBuilder.group({
    message: '',
  });

  isConnected = false;

  @ViewChild('messagesContainer') messagesContainer: ElementRef<HTMLDivElement>;

  get messagesElement() {
    return this.messagesContainer.nativeElement;
  }

  messages: Message[] = [];
  destroy$ = new Subject();
  MessageType = MessageType;
  user: User;

  private readonly scrollOffset = 200;

  constructor(
    private messageService: MessageService,
    private socket: MainSocket,
    private formBuilder: FormBuilder,
    private soundService: SoundService,
    private authService: AuthService,
  ) {}

  get partnerId() {
    switch (this.type) {
      case MessageType.Room:
        return this.room._id;
      case MessageType.Direct:
        return this.to._id;
      default:
        return undefined;
    }
  }

  ngOnInit(): void {
    this.socket.connect();

    this.socket
      .onConnect()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.isConnected = true));

    this.socket
      .onDisconnect()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.isConnected = false));

    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => (this.user = user));

    this.updateMessagesSubject
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(this.getMessages);

    this.messageService
      .getMessage(this.type)
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.handleMessageEvent);

    if (!this.updateMessagesSubject) {
      this.getMessages();
    }
  }

  ngOnDestroy() {
    this.socket.disconnect();

    this.destroy$.next();
    this.destroy$.complete();
  }

  @boundMethod
  getMessages() {
    return this.messageService
      .getMessages(this.type, this.partnerId)
      .pipe(take(1))
      .subscribe(messages => {
        this.messages = messages;

        this.scrollToLastIfNecessary();
      });
  }

  @boundMethod
  handleMessageEvent(message: Message) {
    this.messages.push(message);

    if (message.from._id !== this.user._id) {
      this.soundService.playSound(Sound.Message);
    }

    this.scrollToLastIfNecessary();

    return;
  }

  scrollToLastIfNecessary() {
    const element = this.messagesElement;

    if (
      element.scrollTop >
      element.offsetTop - element.scrollHeight - this.scrollOffset
    ) {
      setTimeout(() => this.scrollToLastMessages());
    }
  }

  scrollToLastMessages() {
    this.messagesElement.scrollTo({
      top: this.messagesElement.scrollHeight,
      behavior: 'smooth',
    });
  }

  sendMessage() {
    const message = this.messageForm.value.message;

    if (!message?.trim()) {
      return;
    }

    if (!this.isConnected) {
      this.handleMessageCallback();
    }

    switch (this.type) {
      case MessageType.Room:
        this.messageService.sendRoomMessage(
          this.room,
          message,
          this.handleMessageCallback,
        );
        break;
      case MessageType.Direct:
        this.messageService.sendDirectMessage(
          this.to,
          message,
          this.handleMessageCallback,
        );
        break;
      default:
        break;
    }
  }

  @boundMethod
  handleMessageCallback(response?: boolean | HttpError) {
    if (typeof response !== 'object') {
      this.messageForm.patchValue({
        message: '',
      });
    }
  }
}
