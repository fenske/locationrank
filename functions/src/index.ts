import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

export const updateCampaignProgress = functions.https.onRequest((request, response) => {
    const campaignId = "campaign-id-1"
    if (request.body.event === "Geofence Entered") {
        const db = admin.firestore()
        const userRef = db.doc("/users/" + request.body.userId)
        if (userRef != null) {
            db.runTransaction(function(transaction) {
                return transaction.get(userRef).then(function(user) {
                    console.info("User snapshot: " + JSON.stringify(user.data()))
                    const updatedCampaigns = user.data().campaigns
                    if (updatedCampaigns[campaignId] != null) {
                        const places = updatedCampaigns[campaignId].places
                        if (places != null) {
                            console.info("User: " + user.id + ". Progress before update: " + JSON.stringify(places))
                            const enteredGeofenceId = request.body.properties.geofence_id
                            if (enteredGeofenceId != null) {
                                console.info("Entered Geofence: " + enteredGeofenceId)
                                for (const p in places) {
                                    if (p === enteredGeofenceId) {
                                        updatedCampaigns[campaignId].places[p].visited = places[p].visited + 1
                                        console.info("User: " + user.id + ". Progress after update: " + JSON.stringify(places))
                                        transaction.update(userRef, {campaigns : updatedCampaigns})
                                    }
                                }
                            } else {
                                console.warn("No geofence id found in Radar request: " + JSON.stringify(request.body))
                            }
                        } else {
                            console.warn("No defined places inside campaign " + campaignId + " for user " + user.id)    
                        }
                    } else { 
                        console.warn("Predefined campaign " + campaignId + " not found for user " + user.id)
                    }
                    return updatedCampaigns
                })
            }).then(function(updatedCampaigns) {
                return response.status(200).send()
            }).catch(function(err) {
                console.error(err)
                return response.status(500).send()
            })
        } else {
            console.error("User " + request.body.userId + " not found.")
        }
    } else {
        console.info("Event with type " + request.body.event + " not supported")
    }
    return response.status(200).send()
});
