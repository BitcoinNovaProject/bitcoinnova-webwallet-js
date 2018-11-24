using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebWallet.Models
{
    public class CachedTx
    {
        public int Id { get; set; } //required for BSON storage
        public int height { get; set; } //height
        public string hash { get; set; } //height
        public int timestamp { get; set; } //timestamp
        public string paymentId { get; set; } //paymentId
        public Int64 fee { get; set; } //fee
        public int unlock_time { get; set; } //unlock time
        public string publicKey { get; set; }
        public List<CachedInput> vin { get; set; } //inputs
        public List<CachedOutput> vout { get; set; } //outputs
    }

    public class CachedInput
    {
        public Int64 amount { get; set; } //amount
        public string k_image { get; set; } //k_image
    }
    public class CachedOutput
    {
        public int globalIndex { get; set; } //global_index
        public Int64 amount { get; set; } //amount
        public string key { get; set; } //key
    }

    public class CachedSignature{
        public int first { get; set; } //first
        public string second { get; set; } //first
    }
}
