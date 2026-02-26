import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: string;
    displayName: string;
    text?: string;
    sender: Principal;
    mediaUrl?: string;
    groupId: string;
    timestamp: bigint;
    mediaType: MediaType;
}
export interface MemoryPost {
    id: string;
    title: string;
    description: string;
    author: Principal;
    imageUrl: string;
    timestamp: bigint;
    familyGroupId: string;
}
export interface UserProfile {
    name: string;
}
export interface FamilyGroupDTO {
    id: string;
    owner: Principal;
    name: string;
    memberCount: bigint;
}
export enum MediaType {
    video = "video",
    none = "none",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMemberToGroup(groupId: string, member: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFamilyGroup(id: string, name: string): Promise<FamilyGroupDTO>;
    createMemoryPost(id: string, title: string, description: string, imageUrl: string, familyGroupId: string): Promise<MemoryPost>;
    deleteMessage(messageId: string): Promise<void>;
    getAllFamilyGroups(): Promise<Array<FamilyGroupDTO>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDisplayName(user: Principal): Promise<string>;
    getFamilyGroupDetails(groupId: string): Promise<FamilyGroupDTO>;
    getMemoriesByGroup(groupId: string): Promise<Array<MemoryPost>>;
    getMessages(groupId: string, limit: bigint, beforeTimestamp: bigint | null): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeMemberFromGroup(groupId: string, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(id: string, groupId: string, text: string | null, mediaUrl: string | null, mediaType: MediaType): Promise<Message>;
}
