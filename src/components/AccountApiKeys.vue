<template>
    <div class="card bg-dark text-white border-secondary">
        <div class="card-header h4 border-secondary">
            API Keys
        </div>
        <div class="table-responsive table-bordered table-striped table-dark" style="overflow-x: hidden">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col" class="text-white text-center">Name</th>
                        <th scope="col" class="text-white text-center">Key</th>
                        <th scope="col" class="text-white text-center">Secret</th>
                        <th scope="col" class="text-white text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(api, index) in apiKeys">
                        <th scope="row" class="text-white text-center align-middle">{{ api.name }}</th>
                        <td class="text-white text-center align-middle text-truncate" style="max-width: 200px">{{ api.key }}</td>
                        <td class="text-white text-center align-middle">***</td>
                        <td class="text-center align-middle">
                            <button type="button" class="btn btn-danger" @click="$emit('delete-api-key', index)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="card-footer">
            <div class="input-group" id="input-group-new-api-key">
                <input type="text" id="newApiName" class="form-control" placeholder="Name">
                <input type="text" id="newApiKey" class="form-control" placeholder="API Key">
                <input type="text" id="newApiSecret" class="form-control" placeholder="API Secret">
                <div class="input-group-append">
                    <button class="btn btn-outline-light" type="button" @click="$emit('add-api-key', $event)">Add</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        apiKeys: {type: Array, required: true}
    }
}
</script>
