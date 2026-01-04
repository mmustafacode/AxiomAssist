import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    ui?: string;
    id?: string;
    createdAt?: Date;
}

export interface IChat extends Document {
    userId: string;
    title: string;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema(
    {
        role: { type: String, required: true },
        content: { type: String, required: true },
        ui: { type: String },
        id: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const ChatSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        messages: [MessageSchema],
    },
    { timestamps: true }
);

const Chat: Model<IChat> = mongoose.models?.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
