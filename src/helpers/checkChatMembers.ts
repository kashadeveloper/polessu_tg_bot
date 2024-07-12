import { Bot, NewChatMembersContext } from "gramio";

export function isMeAdded(members: NewChatMembersContext<Bot>["eventMembers"]) {
    let result = false;
    members.forEach(members => {
        if(members.id === Number(process.env.BOT_ID)) {
            result = true;
        }
    })
    return result;
}