import List "mo:core/List";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getDisplayName(user : Principal) : async Text {
    switch (userProfiles.get(user)) {
      case (null) { "" };
      case (?profile) { profile.name };
    };
  };

  module Family {
    public type MemoryPost = {
      id : Text;
      title : Text;
      description : Text;
      imageUrl : Text;
      author : Principal;
      timestamp : Int;
      familyGroupId : Text;
    };

    public type FamilyGroup = {
      id : Text;
      name : Text;
      owner : Principal;
      members : Set.Set<Principal>;
    };

    public type FamilyGroupDTO = {
      id : Text;
      name : Text;
      owner : Principal;
      memberCount : Nat;
    };

    public func compareMemories(a : MemoryPost, b : MemoryPost) : Order.Order {
      if (a.timestamp < b.timestamp) { return #less };
      if (a.timestamp > b.timestamp) { return #greater };
      #equal;
    };

    public func familyGroupToDTO(group : FamilyGroup) : FamilyGroupDTO {
      {
        id = group.id;
        name = group.name;
        owner = group.owner;
        memberCount = group.members.size();
      };
    };
  };

  module Chat {
    public type MediaType = { #image; #video; #none };

    public type Message = {
      id : Text;
      groupId : Text;
      sender : Principal;
      displayName : Text;
      text : ?Text;
      mediaUrl : ?Text;
      mediaType : MediaType;
      timestamp : Int;
    };

    public func compareMessages(a : Message, b : Message) : Order.Order {
      if (a.timestamp < b.timestamp) { return #greater };
      if (a.timestamp > b.timestamp) { return #less };
      #equal;
    };
  };

  let memories = List.empty<Family.MemoryPost>();
  let familyGroups = Map.empty<Text, Family.FamilyGroup>();
  let messages = Map.empty<Text, List.List<Chat.Message>>();

  public shared ({ caller }) func createFamilyGroup(id : Text, name : Text) : async Family.FamilyGroupDTO {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create family groups");
    };
    let existingGroup = familyGroups.get(id);
    switch (existingGroup) {
      case (?_) { Runtime.trap("Group with this ID already exists") };
      case (null) {
        let newGroup = {
          id;
          name;
          owner = caller;
          members = Set.fromIter([caller].values());
        };
        familyGroups.add(id, newGroup);
        Family.familyGroupToDTO(newGroup);
      };
    };
  };

  public shared ({ caller }) func addMemberToGroup(groupId : Text, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add members to groups");
    };
    switch (familyGroups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the group owner or an admin can add members");
        };
        let updatedMembers = Set.fromIter(group.members.values());
        updatedMembers.add(member);
        familyGroups.add(
          groupId,
          {
            group with
            members = updatedMembers
          },
        );
      };
    };
  };

  public shared ({ caller }) func removeMemberFromGroup(groupId : Text, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove members from groups");
    };
    switch (familyGroups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the group owner or an admin can remove members");
        };
        group.members.remove(member);
      };
    };
  };

  public query ({ caller }) func getFamilyGroupDetails(groupId : Text) : async Family.FamilyGroupDTO {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view family group details");
    };
    let group = switch (familyGroups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };
    if (not group.members.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members or admins can view group details");
    };
    Family.familyGroupToDTO(group);
  };

  public query ({ caller }) func getAllFamilyGroups() : async [Family.FamilyGroupDTO] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list family groups");
    };

    familyGroups.values().toArray().map<Family.FamilyGroup, Family.FamilyGroupDTO>(
      func(group) { Family.familyGroupToDTO(group) }
    );
  };

  public shared ({ caller }) func createMemoryPost(
    id : Text,
    title : Text,
    description : Text,
    imageUrl : Text,
    familyGroupId : Text,
  ) : async Family.MemoryPost {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create memory posts");
    };
    let group = switch (familyGroups.get(familyGroupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };
    if (not group.members.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members can create memories in this group");
    };
    let memory = {
      id;
      title;
      description;
      imageUrl;
      author = caller;
      timestamp = Time.now();
      familyGroupId;
    };
    memories.add(memory);
    memory;
  };

  public query ({ caller }) func getMemoriesByGroup(groupId : Text) : async [Family.MemoryPost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view family memories");
    };
    let group = switch (familyGroups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };
    if (not group.members.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members can view memories in this group");
    };
    let filtered = memories.filter(
      func(memory) { memory.familyGroupId == groupId }
    );
    filtered.toArray().sort(Family.compareMemories);
  };

  public shared ({ caller }) func sendMessage(
    id : Text,
    groupId : Text,
    text : ?Text,
    mediaUrl : ?Text,
    mediaType : Chat.MediaType,
  ) : async Chat.Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let group = switch (familyGroups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };

    if (not group.members.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members can send messages in this group");
    };

    let senderDisplayName = switch (userProfiles.get(caller)) {
      case (null) { "" };
      case (?profile) { profile.name };
    };

    let message : Chat.Message = {
      id;
      groupId;
      sender = caller;
      displayName = senderDisplayName;
      text;
      mediaUrl;
      mediaType;
      timestamp = Time.now();
    };

    let existingMessages = switch (messages.get(groupId)) {
      case (null) { List.empty<Chat.Message>() };
      case (?msgs) { msgs };
    };

    existingMessages.add(message);
    messages.add(groupId, existingMessages);

    message;
  };

  public query ({ caller }) func getMessages(
    groupId : Text,
    limit : Nat,
    beforeTimestamp : ?Int,
  ) : async [Chat.Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    let group = switch (familyGroups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };

    if (not group.members.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members can view messages in this group");
    };

    let groupMessages = switch (messages.get(groupId)) {
      case (null) { List.empty<Chat.Message>() };
      case (?msgs) { msgs };
    };

    let filteredMessagesArray = switch (beforeTimestamp) {
      case (null) { groupMessages.toArray() };
      case (?ts) {
        groupMessages.toArray().filter(
          func(msg) { msg.timestamp < ts }
        );
      };
    };

    let sortedMessages = filteredMessagesArray.sort(Chat.compareMessages);
    let takeLimit = if (sortedMessages.size() > limit) { limit } else { sortedMessages.size() };
    sortedMessages.sliceToArray(0, takeLimit);
  };

  public shared ({ caller }) func deleteMessage(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    let messageGroupIdOpt = messages.keys().find(
      func(groupId) {
        switch (messages.get(groupId)) {
          case (null) { false };
          case (?msgs) {
            msgs.any(
              func(msg) { msg.id == messageId }
            );
          };
        };
      }
    );
    switch (messageGroupIdOpt) {
      case (null) { Runtime.trap("Message not found") };
      case (?groupId) {
        switch (messages.get(groupId)) {
          case (null) { Runtime.trap("Message not found") };
          case (?groupMessages) {
            let messageIndexOpt = groupMessages.toArray().findIndex(func(msg) { msg.id == messageId });
            switch (messageIndexOpt) {
              case (null) { Runtime.trap("Message not found") };
              case (?index) {
                let message = groupMessages.toArray()[index];
                let group = switch (familyGroups.get(groupId)) {
                  case (null) { Runtime.trap("Group not found") };
                  case (?group) { group };
                };

                if (message.sender != caller and group.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                  Runtime.trap("Unauthorized: Only the sender, group owner, or admin can delete messages");
                };

                let remainingMessages = groupMessages.filter(
                  func(msg) { msg.id != messageId }
                );

                messages.add(groupId, remainingMessages);
              };
            };
          };
        };
      };
    };
  };
};
