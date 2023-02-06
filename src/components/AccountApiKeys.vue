<template>
    <div class="card mb-2 bg-dark text-white border-secondary" style="height: 300px;">
        <div class="card-header h3 border-secondary">
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
                    <tr v-for="api in apiKeys">
                        <th scope="row" class="text-white text-center align-middle">{{ api.name }}</th>
                        <td class="text-white text-center align-middle text-truncate" style="max-width: 200px">{{ api.key }}</td>
                        <td class="text-white text-center align-middle">***</td>
                        <td class="text-center align-middle">
                            <button type="button" class="btn btn-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
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
