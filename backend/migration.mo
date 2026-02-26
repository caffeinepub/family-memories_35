import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";

module {
  module Old {
    public type UserProfile = {
      name : Text;
    };

    public type MemoryPost = {
      id : Text;
      title : Text;
      description : Text;
      imageUrl : Text;
      author : Principal.Principal;
      timestamp : Int;
      familyGroupId : Text;
    };

    public type FamilyGroup = {
      id : Text;
      name : Text;
      owner : Principal.Principal;
      members : Set.Set<Principal.Principal>;
    };

    public type Actor = {
      userProfiles : Map.Map<Principal.Principal, UserProfile>;
      memories : List.List<MemoryPost>;
      familyGroups : Map.Map<Text, FamilyGroup>;
    };
  };

  module New {
    public type UserProfile = {
      name : Text;
    };

    public type MemoryPost = {
      id : Text;
      title : Text;
      description : Text;
      imageUrl : Text;
      author : Principal.Principal;
      timestamp : Int;
      familyGroupId : Text;
    };

    public type FamilyGroup = {
      id : Text;
      name : Text;
      owner : Principal.Principal;
      members : Set.Set<Principal.Principal>;
    };

    public type Message = {
      id : Text;
      groupId : Text;
      sender : Principal.Principal;
      displayName : Text;
      text : ?Text;
      mediaUrl : ?Text;
      mediaType : MediaType;
      timestamp : Int;
    };

    public type MediaType = { #image; #video; #none };

    public type Actor = {
      userProfiles : Map.Map<Principal.Principal, UserProfile>;
      memories : List.List<MemoryPost>;
      familyGroups : Map.Map<Text, FamilyGroup>;
      messages : Map.Map<Text, List.List<Message>>;
    };
  };

  public func run(old : Old.Actor) : New.Actor {
    {
      old with
      messages = Map.empty<Text, List.List<New.Message>>();
    };
  };
};
